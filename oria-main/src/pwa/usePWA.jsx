import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const CURRENT_CLIENT_VERSION = '1.3.0';
export const CURRENT_CLIENT_VERSION_CODE = 13;

const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  // Forced / Mandatory Update State
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [serverVersionInfo, setServerVersionInfo] = useState(null);
  const [isNativeApk, setIsNativeApk] = useState(false);
  const [nativeApkVersion, setNativeApkVersion] = useState(null);

  // Post-Update Celebration Notification State
  const [postUpdateNotice, setPostUpdateNotice] = useState(null);

  // Check server version and enforce mandatory update
  const checkServerVersion = useCallback(async () => {
    try {
      const res = await fetch(`/api/app-version?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) return;
      const data = await res.json();
      setServerVersionInfo(data);

      const serverMinCode = data.minSupportedVersionCode || 13;
      const isForce = Boolean(data.forceUpdate);

      // 1. Check Native Android APK wrapper version
      const ua = navigator.userAgent;
      const match = ua.match(/HRSDGDG_Mobile_App\/(\d+)\.(\d+)(\.(\d+))?/);
      if (match) {
        setIsNativeApk(true);
        const apkMajor = parseInt(match[1], 10);
        const apkMinor = parseInt(match[2], 10);
        // Compute numerical code e.g. 1.0 -> 10, 1.3 -> 13
        const apkCode = apkMajor * 10 + apkMinor;
        setNativeApkVersion(`${apkMajor}.${apkMinor}`);

        if (isForce && apkCode < serverMinCode) {
          console.warn(`[Version] Outdated Native APK detected: v${apkMajor}.${apkMinor} < required ${data.minSupportedVersion}`);
          setForceUpdateRequired(true);
          return;
        }
      }

      // 2. Check PWA / Web Client version code
      if (isForce && CURRENT_CLIENT_VERSION_CODE < serverMinCode) {
        console.warn(`[Version] Outdated Client Bundle: ${CURRENT_CLIENT_VERSION_CODE} < required ${serverMinCode}`);
        setForceUpdateRequired(true);
        return;
      }
    } catch (err) {
      console.warn('[Version] Failed to check /api/app-version:', err.message);
    }
  }, []);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed)
    const checkIsInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.navigator.standalone === true ||
                           document.referrer.includes('android-app://') ||
                           navigator.userAgent.includes('HRSDGDG_Mobile_App');
      setIsInstalled(isStandalone);
    };

    checkIsInstalled();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkIsInstalled);

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    // Detect if running inside HRSDGDG APK
    if (window.navigator.userAgent.includes('HRSDGDG_Mobile_App')) {
      setIsNativeApk(true);
    }

    // 3. Post-Update Check & Notification Trigger
    const previousVersion = localStorage.getItem('hrsdgdg_app_version');
    const justReloadedFromUpdate = localStorage.getItem('hrsdgdg_update_reloaded');

    if (justReloadedFromUpdate === 'true' || (previousVersion && previousVersion !== CURRENT_CLIENT_VERSION)) {
      setPostUpdateNotice({
        show: true,
        version: CURRENT_CLIENT_VERSION,
        previousVersion: previousVersion || '1.0'
      });
      localStorage.removeItem('hrsdgdg_update_reloaded');
      localStorage.setItem('hrsdgdg_app_version', CURRENT_CLIENT_VERSION);

      // Trigger Native OS Notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('HRSDGDG — Mise à jour réussie ✨', {
            body: `L'application a été mise à jour avec succès vers la version ${CURRENT_CLIENT_VERSION}.`,
            icon: '/icons/pwa-192x192.png',
            badge: '/icons/pwa-192x192.png'
          });
        } catch (e) {
          console.warn('Native notification error:', e);
        }
      }
    } else if (!previousVersion) {
      localStorage.setItem('hrsdgdg_app_version', CURRENT_CLIENT_VERSION);
    }

    // 4. Listen for BeforeInstallPromptEvent
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. App Installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. Online / Offline listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 7. Check server version immediately & schedule periodic check every 2 mins
    checkServerVersion();
    const versionInterval = setInterval(checkServerVersion, 2 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 8. Service Worker Registration & Automatic PWA Upgrade
    if ('serviceWorker' in navigator) {
      let swRegistration = null;

      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => {
            swRegistration = reg;
            // Check for updates immediately
            reg.update().catch(() => {});

            // Check whenever a new worker is found
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setWaitingWorker(newWorker);
                    setSwUpdateAvailable(true);
                    // Automatic PWA upgrade: skip waiting immediately to guarantee users never stay on old version
                    console.log('[PWA] New version detected, auto-activating...');
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA] ServiceWorker registration failed:', err);
          });
      });

      // Handle message from Service Worker (e.g., SW_VERSION_UPDATED)
      const handleSwMessage = (event) => {
        if (event.data && (event.data.type === 'SW_VERSION_UPDATED' || event.data.type === 'PWA_UPDATED')) {
          console.log('[PWA] Received SW_VERSION_UPDATED message:', event.data);
          localStorage.setItem('hrsdgdg_update_reloaded', 'true');
          // Reload immediately to serve fresh assets
          window.location.reload();
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMessage);

      // Reload smoothly when new controller takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          localStorage.setItem('hrsdgdg_update_reloaded', 'true');
          window.location.reload();
        }
      });

      // Check for SW update periodically (every 60s)
      const swUpdateInterval = setInterval(() => {
        if (swRegistration) {
          swRegistration.update().catch(() => {});
        }
      }, 60 * 1000);

      return () => {
        clearInterval(swUpdateInterval);
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      };
    }

    return () => {
      clearInterval(versionInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkServerVersion]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
      return false;
    }
  };

  const updateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      forceApplyUpdate();
    }
  };

  // Hard reload & cache purge for forced update
  const forceApplyUpdate = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      }
      localStorage.setItem('hrsdgdg_update_reloaded', 'true');
      window.location.href = window.location.origin + '/?updated=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (e) {
        return false;
      }
    }
    return true;
  };

  const dismissPostUpdateNotice = () => {
    setPostUpdateNotice(null);
  };

  return (
    <PWAContext.Provider
      value={{
        clientVersion: CURRENT_CLIENT_VERSION,
        clientVersionCode: CURRENT_CLIENT_VERSION_CODE,
        isInstallable,
        isInstalled,
        isIOS,
        isOffline,
        swUpdateAvailable,
        forceUpdateRequired,
        serverVersionInfo,
        isNativeApk,
        nativeApkVersion,
        postUpdateNotice,
        dismissPostUpdateNotice,
        promptInstall,
        updateApp,
        forceApplyUpdate,
        requestNotificationPermission
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
