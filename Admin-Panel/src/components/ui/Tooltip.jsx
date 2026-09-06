import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

/**
 * Small, dependency-free accessible tooltip used by the Admin Panel.
 *
 * Shown on hover AND while the trigger keeps keyboard focus; dismissed on
 * Escape or when focus/pointer leaves. Because tooltips are often used inside
 * overflow-clipping containers (e.g. the table wrappers), the tooltip is
 * rendered through a portal to <body> and positioned with `fixed` coordinates
 * measured from the trigger, so it is never clipped or scrolled by a parent.
 *
 * The tooltip is a pointer-events-none decoration: it never intercepts clicks
 * on the trigger (so a link inside still opens normally). It is supplementary
 * to the trigger's own accessible name (the trigger must carry its own
 * aria-label), and it only wires `aria-describedby` while it is actually
 * visible.
 */
export function Tooltip({
  trigger,
  label,
  side = "top",
  offset = 8,
  className,
}) {
  const [rect, setRect] = useState(null);
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    if (!rect) return undefined;
    const onResize = () => measure();
    const scrollable = Array.from(
      document.querySelectorAll("main, [data-tooltip-scroll]")
    );
    window.addEventListener("resize", onResize);
    scrollable.forEach((el) => el.addEventListener("scroll", onResize, true));
    const raf = requestAnimationFrame(measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      scrollable.forEach((el) => el.removeEventListener("scroll", onResize, true));
    };
  }, [rect]);

  // Keep the fixed-position tooltip glued to the trigger on scroll/resize/zoom.
  function measure() {
    if (!wrapperRef.current) return;
    setRect(wrapperRef.current.getBoundingClientRect());
  }

  const openFromInteraction = () => {
    if (wrapperRef.current) {
      setRect(wrapperRef.current.getBoundingClientRect());
    }
    setOpen(true);
  };

  const close = () => setOpen(false);

  const tooltipStyle = rect
    ? side === "top"
      ? { left: rect.left + rect.width / 2, top: rect.top - offset }
      : { left: rect.left + rect.width / 2, top: rect.bottom + offset }
    : undefined;

  return (
    <span
      ref={wrapperRef}
      className={cn("relative inline-flex", className)}
      onPointerEnter={openFromInteraction}
      onPointerLeave={close}
      onFocusCapture={openFromInteraction}
      onBlurCapture={() => {
        if (
          !wrapperRef.current ||
          !wrapperRef.current.contains(document.activeElement)
        ) {
          close();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      {trigger({ id: tooltipId, "aria-describedby": open ? tooltipId : undefined })}

      {open &&
        createPortal(
          <span
            ref={tooltipRef}
            role="tooltip"
            id={tooltipId}
            style={tooltipStyle}
            className={cn(
              "glass-strong pointer-events-none fixed z-[100] -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-xs leading-snug text-foreground shadow-elevated",
              "motion-safe:animate-tooltip-in"
            )}
          >
            <span className="block max-w-[340px] break-words">{label}</span>
          </span>,
          document.body
        )}
    </span>
  );
}
