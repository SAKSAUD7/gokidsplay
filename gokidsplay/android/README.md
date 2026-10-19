# Go Kids Play Android app

The Android app is a **Trusted Web Activity**: a real Android app (package `uk.co.gokidsplay.app`)
that opens https://www.gokidsplay.co.uk full screen. Every website change appears in the app straight
away; the app only needs rebuilding to change its name, icon, colours or start page.

It was generated with Google's [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) from
`twa-manifest.json` (this folder).

| What | Where |
|---|---|
| App settings | `twa-manifest.json` |
| Downloadable APK on the website | `frontend/public/downloads/gokidsplay.apk` → https://www.gokidsplay.co.uk/downloads/gokidsplay.apk (page: /app) |
| Proof the app belongs to the site | `frontend/public/.well-known/assetlinks.json` (signing-key fingerprint) |
| **Signing key (secret, never commit)** | `C:\Users\saksa\.gokidsplay-android\keystore\` (keystore + password file) |
| Build tools (Java 17, Android SDK, Bubblewrap) | `C:\Users\saksa\.gokidsplay-android\` |

## Keep the signing key safe
Android only installs an **update** if it is signed with the same key. Back up the whole
`C:\Users\saksa\.gokidsplay-android\keystore` folder (e.g. password manager / encrypted USB).
If it is lost, the app can never be updated in place.

## Rebuild after a change (new version)
1. In `twa-manifest.json` raise `appVersionCode` by 1 and set `appVersionName` (e.g. `1.0.1`).
2. In PowerShell:
   ```powershell
   $T = "C:\Users\saksa\.gokidsplay-android"
   cd <repo>\gokidsplay\android
   Remove-Item Env:NoDefaultCurrentDirectoryInExePath -ErrorAction SilentlyContinue
   $pw = ((Get-Content "$T\keystore\KEYSTORE-PASSWORD.txt" | ? { $_ -like 'Password*' }) -split ':',2)[1].Trim()
   $env:BUBBLEWRAP_KEYSTORE_PASSWORD = $pw; $env:BUBBLEWRAP_KEY_PASSWORD = $pw
   $env:JAVA_HOME = "$T\jdk\jdk-17.0.20.1+1"; $env:ANDROID_HOME = "$T\sdk"
   & "$T\tools\node_modules\.bin\bubblewrap.cmd" update   # only if twa-manifest.json changed
   & "$T\tools\node_modules\.bin\bubblewrap.cmd" build --skipPwaValidation
   ```
3. Copy `app-release-signed.apk` to `frontend/public/downloads/gokidsplay.apk`, update the version text in
   `frontend/app/(main)/app/AppDownload.tsx`, commit and deploy.

## Google Play (recommended later)
Installing an APK from a website shows Android's "unknown apps" warning. Publishing on Google Play removes
that and gives automatic updates: create a Google Play Console account (one-off fee), create the app
`uk.co.gokidsplay.app`, upload `app-release-bundle.aab`, and add the **Play App Signing** SHA-256 fingerprint
(Play Console → Setup → App integrity) to `assetlinks.json` next to the existing one.

## Check it works
After deploying, open https://www.gokidsplay.co.uk/.well-known/assetlinks.json (must show the fingerprint),
install the APK, and open the app: there should be **no address bar**. If an address bar shows, the
fingerprint in `assetlinks.json` doesn't match the key that signed the app.
