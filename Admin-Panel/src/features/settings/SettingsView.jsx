import { KeyRound, MonitorCog, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { getAccessToken } from "../../services/authSession";
import { apiClient, apiErrorMessage } from "../../services/apiClient";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { formatDateTime } from "../../utils/format";

const inputClasses =
  "h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40";

/** Decode a JWT payload for display purposes only (no verification —
 *  the server verifies on every request; this just renders expiry). */
function readTokenExpiry(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp ? new Date(payload.exp * 1000) : null;
  } catch {
    return null;
  }
}

function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "dark", label: "Dark", hint: "Default GhostCode look" },
    { value: "light", label: "Light", hint: "Bright workspace" },
  ];
  return (
    <Card>
      <CardHeader title="Appearance" subtitle="Applies to this admin panel only" icon={MonitorCog} />
      <CardBody>
        <fieldset>
          <legend className="sr-only">Theme</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                  theme === opt.value
                    ? "border-primary/50 bg-accent/60"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={opt.value}
                  checked={theme === opt.value}
                  onChange={() => setTheme(opt.value)}
                  className="mt-1 accent-[var(--primary)]"
                />
                <span>
                  <span className="block text-sm font-medium">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </CardBody>
    </Card>
  );
}

function ProfileCard({ admin }) {
  return (
    <Card>
      <CardHeader title="Admin profile" subtitle="Provisioned on the server" icon={UserRound} />
      <CardBody>
        <dl className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{admin?.name || "—"}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-mono text-xs">{admin?.email || "—"}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Role</dt>
            <dd><Badge tone="violet">{admin?.role || "—"}</Badge></dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{formatDateTime(admin?.createdAt)}</dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}

function SessionCard() {
  const expiresAt = readTokenExpiry(getAccessToken());

  return (
    <Card>
      <CardHeader title="Session" subtitle="How this panel authenticates" icon={ShieldCheck} />
      <CardBody>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Badge tone="success">Active</Badge>
            <span>
              Authenticated with a short-lived access token kept in memory only.
              {expiresAt && (
                <>
                  {" "}Current token expires{" "}
                  <span className="font-mono text-xs text-foreground">{formatDateTime(expiresAt)}</span> and is
                  renewed automatically.
                </>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Badge tone="neutral">httpOnly</Badge>
            <span>
              Renewal uses a rotating refresh cookie scoped to{" "}
              <code className="font-mono text-xs text-foreground">/api/admin/auth</code> — it is never
              readable by JavaScript.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Badge tone="neutral">No storage</Badge>
            <span>Nothing is persisted to localStorage; closing the tab ends the access token.</span>
          </li>
        </ul>
      </CardBody>
    </Card>
  );
}

function PasswordCard() {
  const { logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!current) { setError("Enter your current password"); return; }
    if (next.length < 8 || next.length > 128) {
      setError("New password must be 8–128 characters");
      return;
    }
    if (next === current) {
      setError("New password must be different from your current password");
      return;
    }
    if (confirm !== next) {
      setError("New password confirmation doesn't match");
      return;
    }
    setBusy(true);
    try {
      await apiClient.post("/admin/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      setDone(true);
      // The server revokes all sessions (including the current one), so the
      // next refresh would bounce to login anyway — sign out deliberately.
      window.setTimeout(() => {
        logout().catch(() => {});
      }, 1600);
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't change password"));
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Password" subtitle="Change credentials" icon={KeyRound} />
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            Current password
            <input
              type="password"
              value={current}
              required
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className={`mt-1.5 ${inputClasses}`}
            />
          </label>
          <label className="block text-sm font-medium">
            New password
            <input
              type="password"
              value={next}
              required
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className={`mt-1.5 ${inputClasses}`}
            />
          </label>
          <label className="block text-sm font-medium">
            Confirm new password
            <input
              type="password"
              value={confirm}
              required
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className={`mt-1.5 ${inputClasses}`}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}

          {done ? (
            <div role="status" className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm">
              Password changed. All other sessions were revoked — signing you out so you can sign
              in again with the new password.
            </div>
          ) : (
            <Button type="submit" disabled={busy}>
              {busy ? "Updating…" : "Update password"}
            </Button>
          )}
        </form>
      </CardBody>
    </Card>
  );
}

export function SettingsView({ admin }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <AppearanceCard />
      <ProfileCard admin={admin} />
      <SessionCard />
      <PasswordCard />
    </div>
  );
}
