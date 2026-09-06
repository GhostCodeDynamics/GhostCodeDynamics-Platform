import { MotionConfig } from "framer-motion";
import { Outlet } from "react-router";
import { ThemeProvider } from "../components/ThemeProvider";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function RootLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <div className="relative flex min-h-dvh flex-col">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </ThemeProvider>
    </MotionConfig>
  );
}
