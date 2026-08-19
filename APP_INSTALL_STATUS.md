# Liquid Glass Studio app install status

Implemented in the repository:

- PWA manifest and standalone metadata
- PWA icon asset
- Service-worker/offline support files
- Additive install/download UI components
- Dedicated `/download-app` route
- Android Bubblewrap APK/AAB build workflow
- Windows packaging workflow scaffold

Binary release status:

- Android `.apk`: requires an Android signing key for a distributable signed build.
- Windows `.msix`: requires package identity/certificate configuration for a distributable signed build.

Once those platform signing requirements are configured, the workflows can generate the release files named:

- `Liquid Glass Studio.apk`
- `Liquid Glass Studio.msix`
