import { apiClient } from "./apiClient";

/**
 * Projects service — public read endpoint only.
 *
 * GET /api/projects -> all projects, sorted by order:
 *   { id, name, slug, category, problem, solution, tech[],
 *     liveUrl, repoUrl, featured, order, publishedAt, ... }
 */
export function listProjects({ signal } = {}) {
  return apiClient.get("/projects", { signal });
}
