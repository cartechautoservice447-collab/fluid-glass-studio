# Liquid Glass Studio — Glass UI / Features / Settings Backup

Snapshot date: 2026-09-04
Source commit: 9607e630fc0f2359b863088ca031f07c9ed1013a

This branch is a dedicated, sparse backup containing only the files needed for the Liquid Glass UI, customization/settings, Study Session/Pomodoro features, PWA/app identity, and cross-device push implementation.

Excluded intentionally: authentication UI, course-management UI, notes UI, Lovable integration metadata, Windows packaging, and unrelated project files.

## Included
- Glass primitives and customization settings
- Study Session and Pomodoro UI/logic
- Study Hub reminder/video behavior
- Study feature panel
- PWA manifest, app icons, and service worker
- Push subscription migration and push Edge Function
- Route/root integration and shared styling used by these features

## Important
This is a source backup, not a complete standalone application. It is intended to preserve the Glass feature implementation so it can be restored into the full project if needed. Secrets are intentionally not included.

GitHub branch: backup/glass-ui-features-settings-2026-09-04
