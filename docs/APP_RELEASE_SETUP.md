# App release setup

The project contains additive packaging workflows for Android and Windows. Existing website features and the existing web build are not replaced by these workflows.

## Android APK

The final Android workflow is:

`.github/workflows/build-android-apk-final.yml`

It uses Bubblewrap to turn the live PWA manifest into a Trusted Web Activity. Bubblewrap can generate a signed `app-release-signed.apk` and `app-release-bundle.aab` when signing credentials are configured. citeturn765334search0

Configure these GitHub Actions secrets:

- `BUBBLEWRAP_KEYSTORE_BASE64` — base64-encoded copy of the persistent Android keystore.
- `BUBBLEWRAP_KEYSTORE_PASSWORD` — keystore password.
- `BUBBLEWRAP_KEY_PASSWORD` — signing-key password.

The keystore must remain private and must not be committed to the repository. A persistent signing key is required so future APK updates keep the same Android signing identity.

The final workflow artifact is named `liquid-glass-studio-android-final` and contains:

- `Liquid Glass Studio.apk`
- `Liquid Glass Studio.aab`

The final Android workflow also validates the generated TWA project and APK contents before uploading the artifacts.

## Windows MSIX

The final Windows workflow is:

`.github/workflows/build-liquid-glass-studio-msix-final.yml`

It builds the separate Windows desktop host and creates `Liquid Glass Studio.msix`. The green GitHub Actions run confirms the packaging job completed successfully.

## Downloads

The app download UI is additive. Final production download links should point to stable GitHub Release assets after the Android APK and Windows MSIX are published to a release. The current UI does not replace or remove the existing application features.
