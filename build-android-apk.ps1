# Build Android APK for HRSDGDG
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

# strings.xml
$stringsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">HRSDGDG</string>
</resources>
"@
[System.IO.File]::WriteAllText("$workDir\res\values\strings.xml", $stringsXml, $utf8NoBom)

# styles.xml
$stylesXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar">
        <item name="android:windowBackground">#0B0C10</item>
    </style>
</resources>
"@
[System.IO.File]::WriteAllText("$workDir\res\values\styles.xml", $stylesXml, $utf8NoBom)

# AndroidManifest.xml
$manifestXml = @"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="ma.sdbo.hrsdgdg"
    android:versionCode="13"
    android:versionName="1.3.0">

    <uses-sdk android:minSdkVersion="23" android:targetSdkVersion="34" />

    <uses-permission android:name="android:permission.INTERNET" />
    <uses-permission android:name="android:permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android:permission.CAMERA" />
    <uses-permission android:name="android:permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android:permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme"
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

# MainActivity.java
$mainActivityJava = @"
package ma.sdbo.hrsdgdg;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

public class MainActivity extends Activity {

    private WebView mWebView;
    private ProgressBar mProgressBar;
    public ValueCallback<Uri[]> mFilePathCallback;
    public static final int FILECHOOSER_RESULTCODE = 1001;
    public static final String APP_URL = "https://hrsdgdg.sdbo.ma/";

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

        setContentView(root);

        initWebView();
        mWebView.loadUrl(APP_URL);
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
        s.setUserAgentString(s.getUserAgentString() + " HRSDGDG_Mobile_App/1.3.0 (vCode:13)");

        mWebView.setWebViewClient(new MyClient(this, mProgressBar));
        mWebView.setWebChromeClient(new MyChromeClient(this, mProgressBar));
    }

    private static class MyClient extends WebViewClient {
        private final Activity act;
        private final ProgressBar pb;
        public MyClient(Activity act, ProgressBar pb) {
            this.act = act;
            this.pb = pb;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            String url = request.getUrl().toString();
            if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("whatsapp:") || url.contains("wa.me")) {
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
            pb.setVisibility(View.VISIBLE);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            pb.setVisibility(View.GONE);
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
                act.startActivityForResult(Intent.createChooser(intent, "Sélectionner un fichier"), FILECHOOSER_RESULTCODE);
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
        if (mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            if (System.currentTimeMillis() - lastBackPressTime < 2000) {
                super.onBackPressed();
            } else {
                Toast.makeText(this, "Appuyez à nouveau pour quitter", Toast.LENGTH_SHORT).show();
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

