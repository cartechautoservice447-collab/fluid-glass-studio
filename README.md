# Liquid Glass Studio

Generate webiste to test dedicated "Apple Liquid Glass Engine" section to the Engine Customization Modal with real-time fluid physics:



1. LIQUID GLASS CONTROLS & SLIDERS:

Add a new subsection in the Settings Modal titled "LIQUID GLASS PHYSICS" with 5 interactive fine-tuning sliders:

- Liquid Density (Viscosity & Refraction: 0px to 40px blur)

- Liquid Transparency (Alpha blending: 5% to 95% panel opacity)

- Liquid Clearness (Distortion & Glare clarity: SVG filter turbulence index)

- Liquid Gel (Surface tension curves & 3D inner edge bevel/shadows)

- Liquid Bounce (Physics spring stiffness [100 to 500] and damping [10 to 40])



2. LIQUID VISUAL & MOTION PHYSICS:

- Use Framer Motion spring physics on all interactive glass panels so cards produce a subtle organic "gel bounce" on click, drag, and hover.

- Apply an SVG displacement filter to panel borders to simulate liquid glass refraction around edges.

- Add dynamic specular highlights (light reflection sheen) that follow cursor position across liquid glass panels.



3. STATE INTEGRATION:

- Map all 5 liquid sliders directly to root CSS variables (--liquid-density, --liquid-transparency, --liquid-clearness, --liquid-gel, --liquid-bounce).

- Save all Liquid Glass choices in the CustomizationContext and persist them to localStorage.

-

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://fluid-glass-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a8577206-2537-4d8b-aa2e-037a0c3f9a98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
