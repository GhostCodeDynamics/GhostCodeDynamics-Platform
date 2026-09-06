import { createContext, useContext } from "react";

/**
 * Namespaced storage key so the admin panel never collides with the
 * customer website theme preference in the same origin. Must match the
 * pre-paint bootstrap script in index.html.
 */
export const STORAGE_KEY = "ghostcode-admin-theme";

export const ThemeContext = createContext(undefined);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
