import Project from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";

export async function listProjects() {
  return Project.find({ publishedAt: { $ne: null } })
    .sort({ order: 1, publishedAt: -1, _id: 1 })
    .lean();
}

export async function getProjectBySlug(slug) {
  const project = await Project.findOne({ slug, publishedAt: { $ne: null } }).lean();
  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  return project;
}
