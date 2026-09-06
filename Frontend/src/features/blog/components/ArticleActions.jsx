import { useEffect, useRef, useState } from "react";
import { Bookmark, Heart, Link2, Share2 } from "lucide-react";
import { useBlogInteractions } from "../../../context/blogInteractionsStore";
import { apiErrorMessage } from "../../../services/apiClient";
import { cn } from "../../../utils/cn";

const SHARE_URLS = {
  LinkedIn: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  X: (u, t) => `https://x.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  Facebook: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  WhatsApp: (u, t) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}`,
  Telegram: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
};

export function ArticleActions({ slug, title, baseLikes }) {
  const { isLiked, isBookmarked, likeCount, toggleLike, toggleBookmark } = useBlogInteractions();
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    if (!shareOpen) return undefined;
    function onPointerDown(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShareOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setShareOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [shareOpen]);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const liked = isLiked(slug);
  const bookmarked = isBookmarked(slug);

  function flash(msg) {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 2200);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch {
      flash("Couldn't copy link");
    }
  }

  async function handleToggleLike() {
    try {
      await toggleLike(slug);
    } catch (err) {
      flash(apiErrorMessage(err, "Couldn't update your like. Please try again."));
    }
  }

  async function handleToggleBookmark() {
    try {
      await toggleBookmark(slug);
    } catch (err) {
      flash(apiErrorMessage(err, "Couldn't update your bookmark. Please try again."));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleToggleLike}
        aria-pressed={liked}
        aria-label={liked ? "Unlike article" : "Like article"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
          liked
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : "border-border bg-surface/60 text-muted-foreground hover:text-foreground",
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
        {likeCount(slug, baseLikes)}
      </button>
      <button
        type="button"
        onClick={handleToggleBookmark}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark article"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
          bookmarked
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-surface/60 text-muted-foreground hover:text-foreground",
        )}
      >
        <Bookmark className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
        {bookmarked ? "Saved" : "Save"}
      </button>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShareOpen((o) => !o)}
          aria-expanded={shareOpen}
          aria-haspopup="menu"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        {shareOpen && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated"
          >
            {Object.entries(SHARE_URLS).map(([label, build]) => (
              <a
                key={label}
                role="menuitem"
                href={build(url, title)}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3.5 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {label}
              </a>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                copy();
                setShareOpen(false);
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3.5 py-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Link2 className="h-3.5 w-3.5" /> Copy link
            </button>
          </div>
        )}
      </div>
      {notice && (
        <span role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {notice}
        </span>
      )}
    </div>
  );
}
