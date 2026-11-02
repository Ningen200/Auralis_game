#include <algorithm>
#include <cmath>
#include <cstdint>

// Tiny deterministic combat helpers suitable for compiling to WebAssembly.
extern "C" {
  double auralis_damage(double base, double multiplier, double defense) {
    const double raw = std::max(0.0, base) * std::max(0.0, multiplier);
    return std::max(1.0, raw * (100.0 / (100.0 + std::max(0.0, defense))));
  }

  double auralis_dodge_axis(double input, double speed) {
    return std::clamp(input, -1.0, 1.0) * std::max(0.0, speed);
  }

  int auralis_is_in_range(double dx, double dz, double range) {
    return (dx * dx + dz * dz) <= (range * range) ? 1 : 0;
  }
}
