import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../hooks/useAuth";
import { apiErrorMessage } from "../../services/apiClient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fieldErrorsFrom(apiError) {
  const map = {};
  if (apiError && Array.isArray(apiError.errors)) {
    for (const item of apiError.errors) {
      if (item && item.field && !map[item.field]) {
        map[item.field] = item.message;
      }
    }
  }
  return map;
}

/**
 * Sign-in form against POST /api/admin/auth/login.
 * The httpOnly refresh cookie is set by the response; the access token is
 * kept in memory only (never persisted).
 */
export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const validateLocally = () => {
    const errors = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const localErrors = validateLocally();
    setFieldErrors(localErrors);
    if (Object.keys(localErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const mapped = fieldErrorsFrom(err);
      if (Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
        setFormError("Please correct the highlighted fields.");
      } else {
        setFormError(
          err && err.status === 401
            ? "Invalid email or password."
            : apiErrorMessage(err)
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        placeholder="admin@yourdomain.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        disabled={submitting}
        autoFocus
        required
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          disabled={submitting}
          className="pr-12"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute right-2 top-[30px] grid size-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
        >
          {showPassword ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </button>
      </div>

      {formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" loading={submitting} className="w-full ring-glow">
        {!submitting && <LogIn aria-hidden="true" className="size-4" />}
        {submitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Authorized personnel only. Sessions are protected by rotating,
        httpOnly refresh cookies.
      </p>
    </form>
  );
}
