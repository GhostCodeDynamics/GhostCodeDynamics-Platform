import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { RootLayout } from "./layouts/RootLayout";
import { BlogInteractionsProvider } from "./context/BlogInteractionsContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Careers = lazy(() => import("./pages/Careers"));
const Community = lazy(() => import("./pages/Community"));
const Founder = lazy(() => import("./pages/Founder"));
const Internships = lazy(() => import("./pages/Internships"));
const Labs = lazy(() => import("./pages/Labs"));
const Verify = lazy(() => import("./pages/Verify"));

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-label="Loading"
      />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BlogInteractionsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<RootLayout />}>
                <Route index element={<Home />} />
                <Route path="services" element={<Services />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="about" element={<About />} />
                <Route path="founder" element={<Founder />} />
                <Route path="contact" element={<Contact />} />
                <Route path="blog" element={<Blog />} />
                <Route path="blog/:slug" element={<BlogPost />} />
                <Route path="careers" element={<Careers />} />
                <Route path="community" element={<Community />} />
                <Route path="internships" element={<Internships />} />
                <Route path="labs" element={<Labs />} />
                <Route path="verify" element={<Verify />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </BlogInteractionsProvider>
    </ErrorBoundary>
  );
}
