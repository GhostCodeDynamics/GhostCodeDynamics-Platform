import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { PageHero, Reveal, SectionHeader } from "../components/Section";
import { PostCard } from "../features/blog/components/PostCard";
import { NewsletterCard } from "../features/blog/components/NewsletterCard";
import { SearchInput } from "../features/blog/components/SearchInput";
import { CategoryFilter } from "../features/blog/components/CategoryFilter";
import { CtaLink } from "../components/CtaButton";
import { Seo } from "../components/Seo";
import { webPageSchema, breadcrumbSchema } from "../lib/seo";
import { getEditorsPicks, getFeaturedPost, getTrending, listPosts } from "../services/blogService";
import { useDebounce } from "../hooks/useDebounce";
import { cn } from "../utils/cn";

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "views", label: "Most viewed" },
  { key: "likes", label: "Most liked" },
  { key: "comments", label: "Most discussed" },
];

function mergePosts(prev, next)
{
  const bySlug = new Map(prev.map((p) => [p.slug, p]));
  for (const p of next)
  {
    if (p && p.slug && !bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  return [...bySlug.values()];
}

const PAGE_SIZE = 9;

export default function Blog()
{
  const [category, setCategory] = useState("All");
  const [tag, setTag] = useState(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [featured, setFeatured] = useState(null);
  const [picks, setPicks] = useState([]);
  const [trending, setTrending] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [knownPosts, setKnownPosts] = useState([]);
  const categories = useMemo(
    () => Array.from(new Set(knownPosts.map((p) => p.category).filter(Boolean))).sort(),
    [knownPosts],
  );
  const tags = useMemo(
    () => Array.from(new Set(knownPosts.flatMap((p) => p.tags ?? []))).sort(),
    [knownPosts],
  );

  // Reset page when filters change
  useEffect(() =>
  {
    setPage(1);
  }, [category, tag, debouncedSearch, sort, retryKey]);

  useEffect(() =>
  {
    let live = true;
    Promise.all([getFeaturedPost(), getEditorsPicks(3), getTrending(4)])
      .then(([f, e, t]) =>
      {
        if (!live) return;
        setFeatured(f);
        setPicks(e);
        setTrending(t);
        setKnownPosts((prev) => mergePosts(prev, [f, ...e, ...t]));
      })
      .catch(() =>
      {
        if (!live) return;
        setFeatured(null);
        setPicks([]);
        setTrending([]);
      });
    return () =>
    {
      live = false;
    };
  }, []);

  useEffect(() =>
  {
    const controller = new AbortController();
    setLoading(true);
    setListError(false);
    listPosts(
      {
        category: category === "All" ? undefined : category,
        tag: tag ?? undefined,
        search: debouncedSearch,
        sort,
        page,
        limit: PAGE_SIZE,
      },
      { signal: controller.signal },
    )
      .then(({ posts, meta }) =>
      {
        setList(posts);
        setHasMore(meta && page < meta.totalPages);
        setKnownPosts((prev) => mergePosts(prev, posts));
        setLoading(false);
      })
      .catch(() =>
      {
        if (controller.signal.aborted) return;
        setList([]);
        setListError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [category, tag, debouncedSearch, sort, page, retryKey]);

  return (
    <>
      <Seo
        title="GhostCode Insights - Engineering, security, and career notes"
        description="GhostCode Insights: a founder-written engineering publication on MERN, backend, system design, DevOps and cybersecurity from the GhostCode Dynamics team."
        path="/blog"
        schemas={[
          webPageSchema(
            "GhostCode Insights - Engineering, security, and career notes",
            "GhostCode Insights: a founder-written engineering publication on MERN, backend, system design, DevOps and cybersecurity from the GhostCode Dynamics team.",
            "/blog",
          ),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Insights", path: "/blog" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="GhostCode Insights"
        title="Notes from the lab."
        description="A founder-written engineering publication — MERN, backend, system design, DevOps and security. Long enough to be useful, short enough to actually read."
      />

      <section className="container-prose pb-12">
        <div className="mt-12 grid gap-6 md:grid-cols-[1fr_320px]">
          <SearchInput value={search} onChange={setSearch} />
          <div className="flex items-center gap-3">
            <label
              htmlFor="sort"
              className="text-xs uppercase tracking-widest text-muted-foreground"
            >
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-11 flex-1 rounded-full border border-border bg-surface/60 px-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5">
          <CategoryFilter items={["All", ...categories]} active={category} onSelect={setCategory} />
        </div>
        {tag && (
          <div className="mt-4 text-xs text-muted-foreground">
            Filtering by tag{" "}
            <button
              type="button"
              onClick={() => setTag(null)}
              className="ml-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-primary"
            >
              #{tag} <span aria-hidden>×</span>
            </button>
          </div>
        )}
      </section>

      {featured && !debouncedSearch && category === "All" && !tag && (
        <section className="container-prose">
          <SectionHeader eyebrow="Featured" title="This week's read" />
          <div className="mt-6">
            <Reveal>
              <PostCard post={featured} variant="featured" />
            </Reveal>
          </div>
        </section>
      )}

      <section className="container-prose mt-16">
        <div className="flex items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Latest"
            title={search || category !== "All" || tag ? "Results" : "Latest articles"}
          />
          <p className="pb-2 text-xs text-muted-foreground">
            {loading ? "Loading…" : `${list.length} article${list.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="mt-6">
          {listError ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              <p>We couldn't load articles right now.</p>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="mt-4 text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : list.length === 0 && !loading ? (
            <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Nothing matches those filters yet. Try a different category or search term.
            </p>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p, i) => (
                  <motion.div
                    key={p.slug}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                  >
                    <PostCard post={p} />
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition hover:bg-surface hover:border-primary/40 disabled:opacity-60"
                  >
                    {loading ? "Loading…" : "Load more articles"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="container-prose mt-20 grid gap-10 lg:grid-cols-[1fr_1fr]">
        {trending.length > 0 && (
          <div>
            <SectionHeader eyebrow="Trending" title="What readers are on" />
            <div className="mt-6">
              <ul className="space-y-3">
                {trending.map((p, i) => (
                  <li
                    key={p.slug}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur transition hover:border-primary/40"
                  >
                    <span className="font-display text-2xl text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Link
                      to={`/blog/${p.slug}`}
                      className="flex-1 text-sm font-medium text-foreground hover:text-primary"
                    >
                      {p.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {p.views.toLocaleString()} views
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {picks.length > 0 && (
          <div>
            <SectionHeader eyebrow="Editor's picks" title="Handpicked reads" />
            <div className="mt-6">
              <div className="grid gap-4 ">
                {picks.map((p) => (
                  <Reveal key={p.slug}>
                    <PostCard post={p} variant="compact" />
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="container-prose mt-20">
        <SectionHeader eyebrow="Tags" title="Browse by topic" />
        <div className="flex flex-wrap gap-2 mt-8">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? null : t)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition",
                tag === t
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-surface/60 text-muted-foreground hover:text-foreground",
              )}
            >
              #{t}
            </button>
          ))}
        </div>
      </section>

      <section className="container-prose mt-20 mb-20 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <NewsletterCard />
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            Need help shipping?
          </p>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
            We build MERN products for founders.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            If you're reading Insights and thinking "we need this in production" — let's talk.
          </p>
          <div className="mt-5">
            <CtaLink to="/contact">Start a project</CtaLink>
          </div>
        </div>
      </section>
    </>
  );
}
