/**
 * Minimal, zero-dependency Markdown-ish renderer for blog articles
 * delivered by the GhostCode Dynamics API (MongoDB-backed).
 * Supports: h2/h3, paragraphs, unordered lists, blockquotes, inline
 * code, bold, and fenced code blocks.
 */
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { slugify } from "../../../utils/format";

function parse(md) {
  const lines = md.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", content: buf.join("\n"), lang });
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", content: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", content: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith("> ")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "blockquote", content: buf.join(" ") });
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: "ul", content: "", items });
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    // paragraph — accumulate until blank line
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("> ") &&
      !lines[i].startsWith("```")
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", content: buf.join(" ") });
  }
  return blocks;
}

function renderInline(text) {
  // **bold** and `code`
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m;
  let key = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const chunk = m[0];
    if (chunk.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {chunk.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <code
          key={key++}
          className="rounded bg-surface/80 px-1.5 py-0.5 font-mono text-[0.85em] text-primary"
        >
          {chunk.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + chunk.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="group relative my-6 overflow-hidden rounded-xl border border-border bg-surface/70">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-sm text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ArticleBody({ markdown }) {
  const blocks = parse(markdown);
  return (
    <div className="space-y-4 text-foreground/90">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={slugify(b.content)}
                className="mt-10 scroll-mt-24 font-display text-2xl font-semibold tracking-tight text-foreground"
              >
                {b.content}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                id={slugify(b.content)}
                className="mt-6 scroll-mt-24 font-display text-xl font-semibold tracking-tight text-foreground"
              >
                {b.content}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="leading-relaxed text-muted-foreground">
                {renderInline(b.content)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="ml-5 list-disc space-y-1.5 text-muted-foreground">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );
          case "blockquote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-primary/60 bg-primary/5 px-4 py-3 italic text-foreground/90"
              >
                {renderInline(b.content)}
              </blockquote>
            );
          case "code":
            return <CodeBlock key={i} code={b.content} lang={b.lang} />;
        }
      })}
    </div>
  );
}
