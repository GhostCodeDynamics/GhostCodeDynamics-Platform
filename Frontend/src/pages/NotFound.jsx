import { Link } from "react-router";
import { Seo } from "../components/Seo";
import { NOINDEX_ROBOTS } from "../lib/seo";

export default function NotFound() {
  return (
    <>
      <Seo
        title="Page Not Found - GhostCode Dynamics"
        description="The page you're looking for has drifted somewhere else. Let's get you back on track."
        path="/"
        robots={NOINDEX_ROBOTS}
      />
      <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-aurora opacity-60 pointer-events-none" />
      <div className="relative max-w-md text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Error 404
        </p>
        <h1 className="mt-3 font-display text-6xl font-semibold text-gradient">Lost in the void</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you're looking for has drifted somewhere else. Let's get you back on track.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
          >
            Back home
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
