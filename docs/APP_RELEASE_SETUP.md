# App release setup

The project now contains additive packaging workflows for Android and Windows.

## Android APK

The Android workflow uses Bubblewrap to turn the live PWA manifest into a Trusted Web Activity APK. Bubblewrap produces a signed `app-release-signed.apk` when signing credentials are configured.

Configure these GitHub Actions secrets before running the Android workflow:

- `BUBBLEWRAP_KEYSTORE_PASSWORD`
- `BUBBLEWRAP_KEY_PASSWORD`

The workflow artifact is named `liquid-glass-studio-android` and contains `Liquid Glass Studio.apk` and the Play Store `.aab`.

## Windows

The Windows workflow currently builds the web application source as a packaging input on a Windows runner. A signed MSIX needs Windows package identity/certificate configuration before it can be distributed as a normal installable Windows package. Microsoft documents MSIX packaging and signing as the next step.

## Downloads

The app download UI is additive. The download targets are intended to point at the latest GitHub release assets once a release is published.
