# Auralis — Echoes of the Sanctuary

A mobile-first fantasy action RPG prototype built with Three.js and Vite.

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Current prototype
- Third-person camera with touch drag and virtual joystick
- Three selectable heroes, party switching and basic combat
- Ruined sanctuary, crystal tower, floating islands, fountain and ambient motes
- Lightweight dynamic daylight-to-dusk lighting cycle
- Responsive mobile HUD and graphics-quality setting

## Native performance experiments
- `native/combat_math.cpp` contains a small WebAssembly-ready combat math module.
- `tools/build_wasm.py` invokes Emscripten when installed. The game continues to use its JavaScript fallback if WASM is not built.

## Art direction
The generated Auralis sanctuary key art is a visual target for the environment and HUD direction. It is not yet wired into runtime as a texture.
