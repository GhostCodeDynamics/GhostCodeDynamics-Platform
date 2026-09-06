/**
 * BlogInteractionsContext
 * -----------------------
 * Client-side store for likes, bookmarks and comments, backed by the
 * GhostCode Dynamics API. The server is the source of truth for whether
 * an interaction exists and for all counts. Local state provides:
 * - session continuity for button state (likedPosts / bookmarkedPosts
 *   flags are persisted; counts are never persisted)
 * - optimistic updates with rollback on failure
 *
 * `likedByMe` on comments is intentionally client-local: the comments
 * GET endpoint is not actor-aware and cannot report it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getGuestName } from "./blogConstants";
import { BlogInteractionsContext } from "./blogInteractionsStore";
import { apiClient } from "../services/apiClient";
import { getClientId } from "../utils/clientId";

const STORAGE_KEY = "ghostcode.blog.interactions.v1";

const initialState = {
  likedPosts: {},
  bookmarkedPosts: {},
  postLikeOffsets: {},
  commentLikes: {},
  commentsBySlug: {},
};

function load() {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      likedPosts:
        parsed && typeof parsed.likedPosts === "object" ? parsed.likedPosts : {},
      bookmarkedPosts:
        parsed && typeof parsed.bookmarkedPosts === "object"
          ? parsed.bookmarkedPosts
          : {},
    };
  } catch {
    return initialState;
  }
}

function save(state) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        likedPosts: state.likedPosts,
        bookmarkedPosts: state.bookmarkedPosts,
      }),
    );
  } catch {
    /* quota / private mode — ignore */
  }
}

function mapServerComment(comment) {
  return {
    id: comment._id,
    postSlug: comment.postSlug,
    parentId: comment.parentId ?? null,
    author: comment.author,
    body: comment.body,
    createdAt: comment.createdAt,
    likes: comment.likes,
  };
}

export function BlogInteractionsProvider({ children }) {
  const [state, setState] = useState(() => load());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    save(state);
  }, [state]);

  const toggleLike = useCallback(async (slug) => {
    const actorId = getClientId();
    const target = !stateRef.current.likedPosts[slug];
    const step = target ? 1 : -1;

    setState((s) => ({
      ...s,
      likedPosts: { ...s.likedPosts, [slug]: target },
      postLikeOffsets: {
        ...s.postLikeOffsets,
        [slug]: (s.postLikeOffsets[slug] ?? 0) + step,
      },
    }));

    try {
      const res = target
        ? await apiClient.post(`/posts/${encodeURIComponent(slug)}/like`, { actorId })
        : await apiClient.del(`/posts/${encodeURIComponent(slug)}/like`, { actorId });
      const confirmed = Boolean(res.data && res.data.liked);
      setState((s) => {
        if ((s.likedPosts[slug] ?? false) === confirmed) return s;
        const correction = (confirmed ? 1 : -1) - step;
        return {
          ...s,
          likedPosts: { ...s.likedPosts, [slug]: confirmed },
          postLikeOffsets: {
            ...s.postLikeOffsets,
            [slug]: (s.postLikeOffsets[slug] ?? 0) + correction,
          },
        };
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        likedPosts: { ...s.likedPosts, [slug]: !target },
        postLikeOffsets: {
          ...s.postLikeOffsets,
          [slug]: (s.postLikeOffsets[slug] ?? 0) - step,
        },
      }));
      throw err;
    }
  }, []);

  const toggleBookmark = useCallback(async (slug) => {
    const actorId = getClientId();
    const target = !stateRef.current.bookmarkedPosts[slug];

    setState((s) => ({
      ...s,
      bookmarkedPosts: { ...s.bookmarkedPosts, [slug]: target },
    }));

    try {
      const res = target
        ? await apiClient.post(`/posts/${encodeURIComponent(slug)}/bookmark`, { actorId })
        : await apiClient.del(`/posts/${encodeURIComponent(slug)}/bookmark`, { actorId });
      const confirmed = Boolean(res.data && res.data.bookmarked);
      setState((s) => {
        if ((s.bookmarkedPosts[slug] ?? false) === confirmed) return s;
        return {
          ...s,
          bookmarkedPosts: { ...s.bookmarkedPosts, [slug]: confirmed },
        };
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        bookmarkedPosts: { ...s.bookmarkedPosts, [slug]: !target },
      }));
      throw err;
    }
  }, []);

  const loadComments = useCallback(async (slug, options = {}) => {
    const res = await apiClient.get(`/posts/${encodeURIComponent(slug)}/comments`, {
      signal: options.signal,
    });
    const comments = Array.isArray(res.data) ? res.data.map(mapServerComment) : [];
    const freshIds = new Set(comments.map((c) => c.id));
    setState((s) => {
      const commentLikes = { ...s.commentLikes };
      for (const id of freshIds) {
        const current = commentLikes[id];
        if (current) commentLikes[id] = { likedByMe: current.likedByMe, delta: 0 };
      }
      return {
        ...s,
        commentLikes,
        commentsBySlug: { ...s.commentsBySlug, [slug]: comments },
      };
    });
    return comments;
  }, []);

  const addComment = useCallback(async ({ slug, body, parentId = null }) => {
    const payload = { body, author: getGuestName() ?? "Anonymous" };
    if (parentId) payload.parentId = parentId;
    const res = await apiClient.post(`/posts/${encodeURIComponent(slug)}/comments`, payload);
    const serverComment = res.data;
    if (!serverComment || !serverComment._id) {
      throw new Error("The server did not return a comment. Please try again.");
    }
    const mapped = mapServerComment(serverComment);
    setState((s) => ({
      ...s,
      commentsBySlug: {
        ...s.commentsBySlug,
        [slug]: [mapped, ...(s.commentsBySlug[slug] ?? [])],
      },
    }));
    return mapped;
  }, []);

  const toggleCommentLike = useCallback(async (commentId) => {
    const actorId = getClientId();
    const before = stateRef.current.commentLikes[commentId];
    const target = before ? !before.likedByMe : true;
    const step = target ? 1 : -1;

    setState((s) => ({
      ...s,
      commentLikes: {
        ...s.commentLikes,
        [commentId]: {
          likedByMe: target,
          delta: (s.commentLikes[commentId]?.delta ?? 0) + step,
        },
      },
    }));

    try {
      const res = target
        ? await apiClient.post(`/comments/${encodeURIComponent(commentId)}/like`, { actorId })
        : await apiClient.del(`/comments/${encodeURIComponent(commentId)}/like`, { actorId });
      const confirmed = Boolean(res.data && res.data.liked);
      setState((s) => {
        const current = s.commentLikes[commentId];
        if (!current || current.likedByMe === confirmed) return s;
        const correction = (confirmed ? 1 : -1) - step;
        return {
          ...s,
          commentLikes: {
            ...s.commentLikes,
            [commentId]: { likedByMe: confirmed, delta: current.delta + correction },
          },
        };
      });
    } catch (err) {
      setState((s) => {
        const current = s.commentLikes[commentId];
        if (!current) return s;
        return {
          ...s,
          commentLikes: {
            ...s.commentLikes,
            [commentId]: { likedByMe: !target, delta: current.delta - step },
          },
        };
      });
      throw err;
    }
  }, []);

  const reconcilePost = useCallback((slug) => {
    setState((s) => {
      if (!(slug in s.postLikeOffsets)) return s;
      const postLikeOffsets = { ...s.postLikeOffsets };
      delete postLikeOffsets[slug];
      return { ...s, postLikeOffsets };
    });
  }, []);

  const value = useMemo(
    () => ({
      isLiked: (slug) => Boolean(state.likedPosts[slug]),
      isBookmarked: (slug) => Boolean(state.bookmarkedPosts[slug]),
      likeCount: (slug, base) => base + (state.postLikeOffsets[slug] ?? 0),
      commentsFor: (slug) =>
        (state.commentsBySlug[slug] ?? []).map((comment) => {
          const local = state.commentLikes[comment.id];
          if (!local) return comment;
          return {
            ...comment,
            likes: comment.likes + local.delta,
            likedByMe: local.likedByMe,
          };
        }),
      loadComments,
      toggleLike,
      toggleBookmark,
      addComment,
      toggleCommentLike,
      reconcilePost,
    }),
    [
      state,
      loadComments,
      toggleLike,
      toggleBookmark,
      addComment,
      toggleCommentLike,
      reconcilePost,
    ],
  );

  return (
    <BlogInteractionsContext.Provider value={value}>{children}</BlogInteractionsContext.Provider>
  );
}
