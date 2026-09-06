import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, Calendar, Clock, Eye, Tag } from "lucide-react";
import NotFound from "./NotFound";
import { ArticleActions } from "../features/blog/components/ArticleActions";
import { ArticleBody } from "../features/blog/components/ArticleBody";
import { CommentThread } from "../features/blog/components/CommentThread";
import { NewsletterCard } from "../features/blog/components/NewsletterCard";
import { PostCard } from "../features/blog/components/PostCard";
import { ReadingProgress } from "../features/blog/components/ReadingProgress";
import { TableOfContents } from "../features/blog/components/TableOfContents";
import { getPostBySlug } from "../services/blogService";
import { ApiError } from "../services/apiClient";
import { useBlogInteractions } from "../context/blogInteractionsStore";
import { formatDate } from "../utils/format";
import { cloudinaryUrl, postCoverSrc } from "../utils/cloudinary";
import { Seo } from "../components/Seo";
import { articleSchema, breadcrumbSchema } from "../lib/seo";

function ArticleFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
        aria-label="Loading"
      />
    </div>
  );
}

function ArticleError() {
  return (
    <div className="container-prose pt-40 pb-24 text-center">
      <p className="text-sm text-muted-foreground">We couldn't load this article right now.</p>
      <Link
        to="/blog"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to all insights
      </Link>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams();
  const { reconcilePost } = useBlogInteractions();
  const [post, setPost] = useState(undefined);
  const [related, setRelated] = useState([]);
  const [nav, setNav] = useState({ prev: null, next: null });
  const [error, setError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    setPost(undefined);
    setError(false);
    getPostBySlug(slug, { signal: controller.signal })
      .then((data) => {
        const { related: rel, prev, next, ...postData } = data;
        setPost(postData);
        setRelated(Array.isArray(rel) ? rel : []);
        setNav({ prev: prev ?? null, next: next ?? null });
        reconcilePost(postData.slug);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 404) {
          setPost(null);
        } else {
          setError(true);
        }
      });
    return () => controller.abort();
  }, [slug, reconcilePost]);

  if (post === undefined && !error) return <ArticleFallback />;
  if (error) return <ArticleError />;
  if (post === null) return <NotFound />;

  return (
    <>
      <Seo
        title={`${post.title} — GhostCode Insights`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        image={post.cover ? cloudinaryUrl(post.cover, { w: 1200, h: 630, fit: "fill" }) : undefined}
        type="article"
        keywords={post.tags.join(", ")}
        schemas={[
          articleSchema(post),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Insights", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <ReadingProgress />

      <article className="relative pt-32 pb-24">
        <div className="container-prose">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Insights
          </Link>

          <header className="mt-6 max-w-3xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
              {post.category}
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{post.subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] uppercase text-primary">
                  {post.author.name
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="text-foreground">{post.author.name}</span>
                <span>· {post.author.role}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> {formatDate(post.publishedAt)}
              </span>
              {post.updatedAt !== post.publishedAt && (
                <span>Updated {formatDate(post.updatedAt)}</span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {post.readingMinutes} min read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3 w-3" /> {post.views.toLocaleString()}
              </span>
            </div>
          </header>

          <figure className="mt-10 overflow-hidden rounded-3xl border border-border">
            {coverError ? (
              <div className="aspect-[16/8] w-full bg-aurora">
                <div className="h-full w-full bg-grid opacity-50" />
              </div>
            ) : (
              <img
                src={postCoverSrc(post.cover)}
                alt={post.title}
                onError={() => setCoverError(true)}
                className="aspect-[16/8] w-full object-cover"
              />
            )}
            <figcaption className="sr-only">Cover image for {post.title}</figcaption>
          </figure>

          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <ArticleBody markdown={post.body} />

              <div className="mt-10 flex flex-wrap items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-surface/60 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div className="mt-10">
                <ArticleActions slug={post.slug} title={post.title} baseLikes={post.likes} />
              </div>

              <nav className="mt-14 grid gap-4 sm:grid-cols-2" aria-label="Article pagination">
                {nav.prev ? (
                  <Link
                    to={`/blog/${nav.prev.slug}`}
                    className="group rounded-2xl border border-border bg-card/60 p-5 transition hover:border-primary/40"
                  >
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowLeft className="h-3 w-3" /> Previous
                    </p>
                    <p className="mt-2 font-medium text-foreground group-hover:text-primary">
                      {nav.prev.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {nav.next && (
                  <Link
                    to={`/blog/${nav.next.slug}`}
                    className="group rounded-2xl border border-border bg-card/60 p-5 text-right transition hover:border-primary/40"
                  >
                    <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      Next <ArrowRight className="h-3 w-3" />
                    </p>
                    <p className="mt-2 font-medium text-foreground group-hover:text-primary">
                      {nav.next.title}
                    </p>
                  </Link>
                )}
              </nav>

              <CommentThread slug={post.slug} />
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-8">
                <TableOfContents markdown={post.body} />
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <section className="mt-20">
              <h2 className="font-display text-2xl font-semibold tracking-tight">Related reads</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} />
                ))}
              </div>
            </section>
          )}

          <div className="mt-20">
            <NewsletterCard />
          </div>
        </div>
      </article>
    </>
  );
}
