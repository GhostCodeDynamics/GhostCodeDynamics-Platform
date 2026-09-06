import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../utils/cn";

const variants = {
  primary: "bg-foreground text-background hover:opacity-90 shadow-elevated",
  secondary:
    "border border-border bg-surface/60 backdrop-blur text-foreground hover:bg-surface hover:border-primary/40",
  ghost: "text-foreground hover:text-primary",
};

export function CtaLink({
  to,
  href,
  external,
  children,
  variant = "primary",
  className,
  icon = true,
}) {
  const classes = cn(
    "group inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all",
    variants[variant],
    className,
  );

  const content = (
    <>
      {children}
      {icon && (
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </>
  );

  if (external || href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={to ?? "/"} className={classes}>
      {content}
    </Link>
  );
}
