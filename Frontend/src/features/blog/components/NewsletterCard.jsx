/**
 * NewsletterCard — signup form wired to the GhostCode Dynamics API
 * (POST /api/newsletter/subscribe). Client-side email validation with
 * inline feedback; the backend is the store of truth for subscriptions.
 */
import { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { apiClient, apiErrorMessage } from "../../../services/apiClient";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setStatus("loading");
    try {
      await apiClient.post("/newsletter/subscribe", {
        email: email.trim().toLowerCase(),
      });
      setStatus("done");
      setEmail("");
    } catch (err) {
      setStatus("idle");
      setError(apiErrorMessage(err, "We couldn't subscribe you right now. Please try again."));
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 backdrop-blur">
      <div className="absolute inset-0 bg-aurora opacity-40 pointer-events-none" aria-hidden />
      <div className="relative">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </span>
        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          GhostCode Insights, in your inbox.
        </h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          One founder-written essay a fortnight — no spam, unsubscribe anytime.
        </p>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row" noValidate>
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            className="h-11 flex-1 rounded-full border border-border bg-background/70 px-4 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "done" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : null}
            Subscribe
          </button>
        </form>
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
        {status === "done" && !error && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            You're on the list — one essay a fortnight, no spam.
          </p>
        )}
      </div>
    </div>
  );
}
