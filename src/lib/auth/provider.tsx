import type { ReactNode } from "react";

/**
 * Minimal auth boundary for the standalone Auralis game build.
 * The game currently has no sign-in UI or authenticated routes, so this
 * provider deliberately renders its children without introducing a fake
 * session. Real authentication can be restored when its auth modules exist.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
