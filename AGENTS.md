# Project context (for humans & AI assistants)

Workshop template for **live interactive visuals**: React + Vite, styled UI, and WebGL via React Three Fiber.

## Stack (use these—do not substitute by default)

| Area | Choice | Notes |
|------|--------|--------|
| Build | **Vite** + **TypeScript** | `vite.config.ts` includes `@tailwindcss/vite`. |
| UI framework | **React 19** | Entry: `src/main.tsx`. |
| Styling | **Tailwind CSS v4** | `@import 'tailwindcss'` in `src/index.css`. Prefer utilities in JSX; global tokens live in `src/index.css` (`:root` / dark). |
| Accessible primitives | **Base UI** (`@base-ui/react`) | Headless/unstyled. Import per component, e.g. `@base-ui/react/button`, `@base-ui/react/dialog`. **Not** Material UI, Chakra, or Radix unless the user asks. |
| 3D | **three**, **@react-three/fiber**, **@react-three/drei** | Scene code belongs in `src/ThreeScene.tsx` (or split modules). Lazy-load heavy 3D from `App.tsx` if the bundle grows. |

## Layout & portals

- `index.html` mounts `#root`.
- `src/index.css`: Base UI recommends `#root { isolation: isolate; }` and `body { position: relative; }` for portaled overlays—keep these when adding dialogs/popovers.

## Source map

```
src/
  main.tsx          # Renders <App />, imports global CSS
  index.css         # Tailwind entry + CSS variables + base typography
  App.tsx           # Workshop shell: copy, controls, lazy Three preview
  App.css           # Workshop layout (brutalist layout classes)
  ThreeScene.tsx    # Canvas, lights, meshes, drei helpers (OrbitControls, etc.)
assets/             # Static images referenced from TS
public/             # Served as-is (favicon, etc.)
```

## Conventions

1. **New UI** → Tailwind classes and/or `App.css` / `index.css`. Use **Base UI** for behavior (buttons, dialogs, popovers, menus, sliders—see [Base UI docs](https://base-ui.com/react/overview/quick-start)).
2. **New 3D** → Extend `ThreeScene.tsx` or add components under `src/` and compose inside `<Canvas>`.
3. **State → visuals** → Pass props from `App.tsx` into `ThreeScene`/`Canvas` children to tie React state to the scene.

## Commands

- `npm run dev` — dev server  
- `npm run build` — production build  
- `npm run lint` — ESLint  

## Package name

`package.json` name: `prjctr-workshop`.
