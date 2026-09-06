import { useCallback, useEffect, useState } from "react";
import { ThemeContext, STORAGE_KEY } from "../hooks/useTheme";

/**
 * Initializes from the class already applied by the inline script in
 * index.html (stored preference -> system preference -> dark), so React
 * never re-flips the theme after first paint.
 */
function getInitialTheme() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme still applies even if persistence is unavailable.
    }
  }, [theme]);

  const setTheme = useCallback((t) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
