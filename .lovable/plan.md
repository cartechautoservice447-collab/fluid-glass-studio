# Add workspace templates

## Scope
Add a new **Workspace Templates** section inside the existing Engine Customization modal without removing or changing any current controls.

## Templates
- **Original Glass** — preserves the app’s current appearance exactly.
- **Graphite Notes** — matches the uploaded reference: charcoal three-column workspace, crisp borders, compact surfaces, and vivid green actions.
- **Frosted Aurora** — brighter translucent glass with cool cyan highlights and soft frosted depth.
- **Midnight OLED** — deep near-black glass with restrained blue accents and high readability.

## Implementation
- Extend the existing customization state with a template preference and persist it per signed-in account in browser storage.
- Add a compact template selector with visual previews inside Engine Customization.
- Apply the selected template through a root data attribute and additive CSS overrides, leaving all notes, courses, editing, autosave, authentication, and Liquid Glass physics unchanged.
- Keep Original Glass as the default so existing users see no change until selecting a template.

## Verification
- Run the project typecheck.
- Verify in preview that all four choices switch immediately, persist after reload, and that existing Engine Customization controls remain present.
