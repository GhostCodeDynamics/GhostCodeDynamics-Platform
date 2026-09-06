import { asyncHandler } from "../utils/asyncHandler.js";
import { validateSlugParam } from "../validators/common.js";
import { listProjects, getProjectBySlug } from "../services/projects.service.js";

export const getProjects = asyncHandler(async (_req, res) => {
  const projects = await listProjects();
  res.json({ success: true, data: projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const slug = validateSlugParam(req.params.slug, "project slug");
  const project = await getProjectBySlug(slug);
  res.json({ success: true, data: project });
});
