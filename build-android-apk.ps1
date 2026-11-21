# Build Android APK for HRSDGDG (Anti-ERR_CACHE_MISS & Resilient Offline/Online Architecture)
$ErrorActionPreference = "Stop"

$sdkDir = "C:\Users\othma\AppData\Local\Android\Sdk"
$buildToolsDir = "$sdkDir\build-tools\35.0.0"
$platformDir = "$sdkDir\platforms\android-34"
$androidJar = "$platformDir\android.jar"

Write-Host "SDK Dir: $sdkDir"
Write-Host "Android JAR exists: $(Test-Path $androidJar)"
Write-Host "Build tools exist: $(Test-Path $buildToolsDir)"

$workDir = "C:\Projects\hrsdgdg\android-build"
if (Test-Path $workDir) {
    Remove-Item -Recurse -Force $workDir
}
New-Item -ItemType Directory -Path "$workDir\gen" | Out-Null
New-Item -ItemType Directory -Path "$workDir\bin" | Out-Null
New-Item -ItemType Directory -Path "$workDir\obj" | Out-Null
New-Item -ItemType Directory -Path "$workDir\res\values" | Out-Null
New-Item -ItemType Directory -Path "$workDir\res\xml" | Out-Null
New-Item -ItemType Directory -Path "$workDir\res\drawable" | Out-Null
New-Item -ItemType Directory -Path "$workDir\res\drawable-hdpi" | Out-Null
New-Item -ItemType Directory -Path "$workDir\res\drawable-xhdpi" | Out-Null
New-Item -ItemType Directory -Path "$workDir\res\drawable-xxhdpi" | Out-Null
New-Item -ItemType Directory -Path "$workDir\src\ma\sdbo\hrsdgdg" | Out-Null

# Copy icons
Copy-Item "C:\Projects\hrsdgdg\oria-main\public\icons\pwa-192x192.png" "$workDir\res\drawable\ic_launcher.png"
Copy-Item "C:\Projects\hrsdgdg\oria-main\public\icons\pwa-192x192.png" "$workDir\res\drawable-hdpi\ic_launcher.png"
Copy-Item "C:\Projects\hrsdgdg\oria-main\public\icons\pwa-192x192.png" "$workDir\res\drawable-xhdpi\ic_launcher.png"
Copy-Item "C:\Projects\hrsdgdg\oria-main\public\icons\pwa-512x512.png" "$workDir\res\drawable-xxhdpi\ic_launcher.png"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# 1. strings.xml
$stringsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">HRSDGDG</string>
</resources>
"@
[System.IO.File]::WriteAllText("$workDir\res\values\strings.xml", $stringsXml, $utf8NoBom)

# 2. styles.xml
$stylesXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar">
        <item name="android:windowBackground">#0B0C10</item>
    </style>
</resources>
"@
[System.IO.File]::WriteAllText("$workDir\res\values\styles.xml", $stylesXml, $utf8NoBom)

# 3. network_security_config.xml
$networkSecurityXml = @"
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">sdbo.ma</domain>
        <domain includeSubdomains="true">hrsdgdg.sdbo.ma</domain>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </domain-config>
</network-security-config>
"@
[System.IO.File]::WriteAllText("$workDir\res\xml\network_security_config.xml", $networkSecurityXml, $utf8NoBom)

# 4. AndroidManifest.xml
$manifestXml = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ma.sdbo.hrsdgdg"
    android:versionCode="23"
    android:versionName="1.4.9">

    <uses-sdk android:minSdkVersion="23" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"@
[System.IO.File]::WriteAllText("$workDir\AndroidManifest.xml", $manifestXml, $utf8NoBom)

# 5. MainActivity.java
$mainActivityJava = @"
package ma.sdbo.hrsdgdg;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    private WebView mWebView;
    private ProgressBar mProgressBar;
    private LinearLayout mErrorLayout;
    public ValueCallback<Uri[]> mFilePathCallback;
    public static final int FILECHOOSER_RESULTCODE = 1001;
    public static final String APP_URL = "https://hrsdgdg.sdbo.ma/";

    public static boolean isNetworkAvailable(Context context) {
        if (context == null) return true;
        try {
            ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return true;
            NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
        } catch (Exception e) {
            return true;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(0xFF0B0C10);
            window.setNavigationBarColor(0xFF0B0C10);
        }

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF0B0C10);

        mWebView = new WebView(this);
        mWebView.setBackgroundColor(0xFF0B0C10);
        
        mProgressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        mProgressBar.setMax(100);
        mProgressBar.setVisibility(View.GONE);

        FrameLayout.LayoutParams pbParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, 8
        );
        root.addView(mWebView, new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(mProgressBar, pbParams);

        createErrorLayout(root);

        setContentView(root);

        initWebView();
        mWebView.loadUrl(APP_URL);
    }

    private void createErrorLayout(FrameLayout root) {
        mErrorLayout = new LinearLayout(this);
        mErrorLayout.setOrientation(LinearLayout.VERTICAL);
        mErrorLayout.setGravity(Gravity.CENTER);
        mErrorLayout.setBackgroundColor(0xFF0B0C10);
        mErrorLayout.setPadding(40, 40, 40, 40);
        mErrorLayout.setVisibility(View.GONE);

        TextView iconView = new TextView(this);
        iconView.setText("💎");
        iconView.setTextSize(48);
        iconView.setGravity(Gravity.CENTER);
        mErrorLayout.addView(iconView);

        TextView titleView = new TextView(this);
        titleView.setText("HRSDGDG");
        titleView.setTextSize(22);
        titleView.setTextColor(0xFFD4AF37);
        titleView.setTypeface(null, Typeface.BOLD);
        titleView.setGravity(Gravity.CENTER);
        titleView.setPadding(0, 16, 0, 8);
        mErrorLayout.addView(titleView);

        TextView msgFr = new TextView(this);
        msgFr.setText("Connexion en cours ou r\u00e9seau instable.\nV\u00e9rifiez votre connexion et r\u00e9essayez.");
        msgFr.setTextSize(14);
        msgFr.setTextColor(0xFFCBD5E1);
        msgFr.setGravity(Gravity.CENTER);
        msgFr.setPadding(0, 8, 0, 8);
        mErrorLayout.addView(msgFr);

        TextView msgAr = new TextView(this);
        msgAr.setText("\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u062e\u0627\u062f\u0645 \u0623\u0648 \u0627\u0644\u0634\u0628\u0643\u0629 \u063a\u064a\u0631 \u0645\u0633\u062a\u0642\u0631\u0629.\n\u064a\u0631\u062c\u0649 \u0627\u0644\u062a\u0623\u0643\u062f \u0645\u0646 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a \u0648\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.");
        msgAr.setTextSize(13);
        msgAr.setTextColor(0xFF94A3B8);
        msgAr.setGravity(Gravity.CENTER);
        msgAr.setPadding(0, 0, 0, 24);
        mErrorLayout.addView(msgAr);

        Button retryBtn = new Button(this);
        retryBtn.setText("\u21bb  R\u00e9essayer  /  \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629");
        retryBtn.setTextColor(0xFF0B0C10);
        retryBtn.setTextSize(15);
        retryBtn.setTypeface(null, Typeface.BOLD);
        retryBtn.setBackgroundColor(0xFFD4AF37);
        retryBtn.setPadding(30, 20, 30, 20);
        retryBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                hideErrorLayout();
                mWebView.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
                mWebView.loadUrl(APP_URL);
            }
        });
        mErrorLayout.addView(retryBtn);

        root.addView(mErrorLayout, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT
        ));
    }

    private void showErrorLayout(String failingUrl) {
        if (mErrorLayout != null) {
            mErrorLayout.setVisibility(View.VISIBLE);
        }
        if (mProgressBar != null) {
            mProgressBar.setVisibility(View.GONE);
        }
    }

    private void hideErrorLayout() {
        if (mErrorLayout != null) {
            mErrorLayout.setVisibility(View.GONE);
        }
    }

    private void initWebView() {
        WebSettings s = mWebView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);

        // Anti-ERR_CACHE_MISS Dynamic Configuration:
        if (isNetworkAvailable(this)) {
            s.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            s.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        try {
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                cookieManager.setAcceptThirdPartyCookies(mWebView, true);
            }
        } catch (Exception ignored) {}

        s.setUserAgentString(s.getUserAgentString() + " HRSDGDG_Mobile_App/1.4.7 (vCode:21)");

        mWebView.setWebViewClient(new MyClient(this, mProgressBar));
        mWebView.setWebChromeClient(new MyChromeClient(this, mProgressBar));
    }

    private class MyClient extends WebViewClient {
        private final Activity act;
        private final ProgressBar pb;
        private int retryCount = 0;
        private static final int MAX_RETRIES = 2;

        public MyClient(Activity act, ProgressBar pb) {
            this.act = act;
            this.pb = pb;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleUrl(view, request.getUrl().toString());
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleUrl(view, url);
        }

        private boolean handleUrl(WebView view, String url) {
            if (url == null) return false;
            if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.contains("wa.me")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    act.startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
            if (url.endsWith(".apk") || url.contains("/downloads/")) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    act.startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
            return false;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            hideErrorLayout();
            pb.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            pb.setVisibility(View.GONE);
            retryCount = 0;
            try {
                view.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            } catch (Exception ignored) {}
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (request.isForMainFrame()) {
                    handleMainFrameError(view, error.getErrorCode(), String.valueOf(error.getDescription()), request.getUrl().toString());
                }
            }
        }

        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            handleMainFrameError(view, errorCode, description, failingUrl);
        }

        private void handleMainFrameError(final WebView view, int errorCode, String description, final String failingUrl) {
            String desc = description != null ? description.toUpperCase() : "";
            if (desc.contains("ERR_CACHE_MISS") || desc.contains("CACHE_MISS") || errorCode == ERROR_UNKNOWN || errorCode == ERROR_CONNECT || errorCode == ERROR_TIMEOUT || errorCode == ERROR_HOST_LOOKUP) {
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    try {
                        view.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);
                    } catch (Exception ignored) {}
                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            view.loadUrl(failingUrl != null && !failingUrl.isEmpty() ? failingUrl : APP_URL);
                        }
                    }, 600 * retryCount);
                    return;
                }
            }
            showErrorLayout(failingUrl != null && !failingUrl.isEmpty() ? failingUrl : APP_URL);
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            String url = error != null ? error.getUrl() : "";
            if (url != null && (url.contains("sdbo.ma") || url.contains("hrsdgdg"))) {
                handler.proceed();
            } else {
                handler.cancel();
            }
        }
    }

    private static class MyChromeClient extends WebChromeClient {
        private final MainActivity act;
        private final ProgressBar pb;
        public MyChromeClient(MainActivity act, ProgressBar pb) {
            this.act = act;
            this.pb = pb;
        }

        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            pb.setProgress(newProgress);
            if (newProgress >= 100) {
                pb.setVisibility(View.GONE);
            } else {
                pb.setVisibility(View.VISIBLE);
            }
        }

        @Override
        public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
            if (act.mFilePathCallback != null) {
                act.mFilePathCallback.onReceiveValue(null);
            }
            act.mFilePathCallback = filePathCallback;

            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            try {
                act.startActivityForResult(Intent.createChooser(intent, "S\u00e9lectionner un fichier"), FILECHOOSER_RESULTCODE);
                return true;
            } catch (Exception e) {
                act.mFilePathCallback = null;
                return false;
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILECHOOSER_RESULTCODE) {
            if (mFilePathCallback != null) {
                Uri[] results = null;
                if (resultCode == RESULT_OK && data != null) {
                    String dataString = data.getDataString();
                    if (dataString != null) {
                        results = new Uri[]{Uri.parse(dataString)};
                    }
                }
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    private long lastBackPressTime = 0;
    @Override
    public void onBackPressed() {
        if (mErrorLayout != null && mErrorLayout.getVisibility() == View.VISIBLE) {
            hideErrorLayout();
            mWebView.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
            mWebView.loadUrl(APP_URL);
            return;
        }
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            if (System.currentTimeMillis() - lastBackPressTime < 2000) {
                super.onBackPressed();
            } else {
                Toast.makeText(this, "Appuyez \u00e0 nouveau pour quitter", Toast.LENGTH_SHORT).show();
                lastBackPressTime = System.currentTimeMillis();
            }
        }
    }
}
"@
[System.IO.File]::WriteAllText("$workDir\src\ma\sdbo\hrsdgdg\MainActivity.java", $mainActivityJava, $utf8NoBom)

Write-Host "Sources written successfully."

# 1. Compile resources with aapt2
Write-Host "Step 1: Compiling resources with aapt2..."
& "$buildToolsDir\aapt2.exe" compile --dir "$workDir\res" -o "$workDir\res.zip"
if ($LASTEXITCODE -ne 0) { throw "aapt2 compile failed with code $LASTEXITCODE" }

# 2. Link resources and generate R.java
Write-Host "Step 2: Linking resources with aapt2..."
& "$buildToolsDir\aapt2.exe" link -I "$androidJar" --manifest "$workDir\AndroidManifest.xml" -o "$workDir\bin\app-unaligned.apk" --java "$workDir\gen" "$workDir\res.zip" --auto-add-overlay
if ($LASTEXITCODE -ne 0) { throw "aapt2 link failed with code $LASTEXITCODE" }

# 3. Compile Java sources (Target Java 8 for Android compatibility)
Write-Host "Step 3: Compiling Java classes..."
$javaFiles = @(Get-ChildItem -Recurse "$workDir\src\*.java" | ForEach-Object { $_.FullName })
$genFiles = @(Get-ChildItem -Recurse "$workDir\gen\*.java" | ForEach-Object { $_.FullName })
$allJava = $javaFiles + $genFiles
& "javac" -source 8 -target 8 -g:none -encoding UTF-8 -d "$workDir\obj" -cp "$androidJar" $allJava
if ($LASTEXITCODE -ne 0) { throw "javac failed with code $LASTEXITCODE" }

# 4. Dex classes with d8
Write-Host "Step 4: Converting classes to dex with d8..."
$classFiles = @(Get-ChildItem -Recurse "$workDir\obj\*.class" | ForEach-Object { $_.FullName })
& "$buildToolsDir\d8.bat" --output "$workDir\bin" $classFiles --lib "$androidJar"
if ($LASTEXITCODE -ne 0) { throw "d8 failed with code $LASTEXITCODE" }

# 5. Add classes.dex into app-unaligned.apk
Write-Host "Step 5: Adding classes.dex to APK..."
Push-Location "$workDir\bin"
& "jar" -uf "app-unaligned.apk" "classes.dex"
Pop-Location
if ($LASTEXITCODE -ne 0) { throw "jar uf failed with code $LASTEXITCODE" }

# 6. Zipalign APK
Write-Host "Step 6: Zipaligning APK..."
if (Test-Path "$workDir\bin\app-aligned.apk") { Remove-Item "$workDir\bin\app-aligned.apk" }
& "$buildToolsDir\zipalign.exe" -f -p 4 "$workDir\bin\app-unaligned.apk" "$workDir\bin\app-aligned.apk"
if ($LASTEXITCODE -ne 0) { throw "zipalign failed with code $LASTEXITCODE" }

# 7. Generate release key if needed
$keystorePath = "$workDir\hrsdgdg-release.jks"
$storePass = "hrsdgdg2026"
$keyAlias = "hrsdgdg"
Write-Host "Step 7: Generating keystore..."
& "keytool" -genkeypair -v -keystore "$keystorePath" -alias "$keyAlias" -keyalg RSA -keysize 2048 -validity 10000 -storepass "$storePass" -keypass "$storePass" -dname "CN=HRSDGDG, OU=Mobile, O=SDBO, L=Casablanca, ST=Casablanca, C=MA"
if ($LASTEXITCODE -ne 0) { throw "keytool failed with code $LASTEXITCODE" }

# 8. Sign APK with apksigner
Write-Host "Step 8: Signing APK with apksigner..."
& "$buildToolsDir\apksigner.bat" sign --ks "$keystorePath" --ks-pass "pass:$storePass" --ks-key-alias "$keyAlias" --key-pass "pass:$storePass" --out "$workDir\bin\hrsdgdg.apk" "$workDir\bin\app-aligned.apk"
if ($LASTEXITCODE -ne 0) { throw "apksigner failed with code $LASTEXITCODE" }

# 9. Verify APK
Write-Host "Step 9: Verifying signed APK..."
& "$buildToolsDir\apksigner.bat" verify "$workDir\bin\hrsdgdg.apk"

# 10. Copy to public/downloads
$destDir = "C:\Projects\hrsdgdg\oria-main\public\downloads"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
Copy-Item "$workDir\bin\hrsdgdg.apk" "$destDir\hrsdgdg.apk" -Force

$apkSize = (Get-Item "$destDir\hrsdgdg.apk").Length
Write-Host "SUCCESS! Android APK built and copied to $destDir\hrsdgdg.apk ($([math]::Round($apkSize / 1KB, 1)) KB)"
