import logoDark from "../assets/brand/logo-dark.png";
import logoLight from "../assets/brand/logo-light.png";
import iconDark from "../assets/brand/icon-dark.png";
import iconLight from "../assets/brand/icon-light.png";
import { cn } from "../utils/cn";

export function LogoMark({ height = 36, className }) {
  return (
    <span
      className={cn("inline-block shrink-0", className)}
      style={{ height, width: height }}
      aria-label="GhostCode Dynamics"
      role="img"
    >
      <img
        src={iconLight}
        alt=""
        draggable={false}
        style={{ height, width: height }}
        className="block object-contain select-none dark:hidden"
      />
      <img
        src={iconDark}
        alt=""
        draggable={false}
        style={{ height, width: height }}
        className="hidden object-contain select-none dark:block"
      />
    </span>
  );
}

export function Logo({ className, height = 32 }) {
  return (
    <span
      className={cn("inline-flex items-center", className)}
      aria-label="GhostCode Dynamics"
    >
      <img
        src={logoLight}
        alt="GhostCode Dynamics"
        draggable={false}
        style={{ height, width: "auto" }}
        className="block object-contain select-none dark:hidden"
      />
      <img
        src={logoDark}
        alt="GhostCode Dynamics"
        draggable={false}
        style={{ height, width: "auto" }}
        className="hidden object-contain select-none dark:block"
      />
    </span>
  );
}
