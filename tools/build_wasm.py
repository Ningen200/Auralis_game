#!/usr/bin/env python3
"""Build the optional C++ combat helper to WebAssembly with Emscripten."""
from pathlib import Path
import shutil, subprocess, sys

compiler = shutil.which("em++")
if not compiler:
    sys.exit("Emscripten em++ was not found. Install the Emscripten SDK, then retry.")
root = Path(__file__).resolve().parents[1]
out = root / "public" / "wasm"
out.mkdir(parents=True, exist_ok=True)
subprocess.run([
    compiler, str(root / "native" / "combat_math.cpp"),
    "-O3", "-std=c++17", "-s", "WASM=1",
    "-s", "STANDALONE_WASM=1", "-s", "EXPORTED_FUNCTIONS=['_auralis_damage','_auralis_dodge_axis','_auralis_is_in_range']",
    "-o", str(out / "combat_math.wasm")
], check=True)
print("Built public/wasm/combat_math.wasm")
