import { useState } from "react";
import { Link } from "react-router";
import { Calendar, Clock, Eye } from "lucide-react";
import { formatDate } from "../../../utils/format";
import { cn } from "../../../utils/cn";
import { postCoverSrc } from "../../../utils/cloudinary";

export function PostCard({ post, variant = "default" }) {
  const featured = variant === "featured";
  const compact = variant === "compact";
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur transition-all hover:border-primary/40 hover:shadow-elevated",
        featured ? "flex-col md:flex-row" : "flex-col",
      )}
      aria-label={post.title}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-surface",
          featured ? "md:w-1/2 aspect-[16/10] md:aspect-auto" : compact ? "aspect-[16/9]" : "aspect-[16/10]",
        )}
      >
        {imgError ? (
          <div className="absolute inset-0 bg-aurora">
            <div className="absolute inset-0 bg-grid opacity-50" />
          </div>
        ) : (
          <img
            src={postCoverSrc(post.cover)}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-foreground backdrop-blur">
          {post.category}
        </span>
      </div>
      <div className={cn("flex flex-1 flex-col gap-3 p-5", featured && "md:p-8")}>
        <h3
          className={cn(
            "font-display font-semibold leading-snug tracking-tight text-foreground group-hover:text-primary transition-colors",
            featured ? "text-2xl md:text-3xl" : compact ? "text-base" : "text-lg",
          )}
        >
          {post.title}
        </h3>
        {!compact && (
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3 w-3" aria-hidden /> {formatDate(post.publishedAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" aria-hidden /> {post.readingMinutes} min read
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-3 w-3" aria-hidden /> {post.views.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
