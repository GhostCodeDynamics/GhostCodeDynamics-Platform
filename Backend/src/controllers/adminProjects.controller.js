import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validateCreateProjectPayload,
  validateUpdateProjectPayload,
  validateReorderPayload,
} from "../validators/adminProjects.validator.js";
import {
  listAdminProjects,
  getAdminProjectById,
  createAdminProject,
  updateAdminProject,
  deleteAdminProject,
  reorderProjects,
} from "../services/adminProjects.service.js";

export const adminListProjectsRoute = asyncHandler(async (_req, res) => {
  const projects = await listAdminProjects();
  res.json({ success: true, data: projects });
});

export const adminGetProjectRoute = asyncHandler(async (req, res) => {
  const project = await getAdminProjectById(req.params.id);
  res.json({ success: true, data: project });
});

export const adminCreateProjectRoute = asyncHandler(async (req, res) => {
  const data = validateCreateProjectPayload(req.body);
  const project = await createAdminProject(data);
  res.status(201).json({ success: true, data: project });
});

export const adminUpdateProjectRoute = asyncHandler(async (req, res) => {
  const patch = validateUpdateProjectPayload(req.body);
  const project = await updateAdminProject(req.params.id, patch);
  res.json({ success: true, data: project });
});

export const adminDeleteProjectRoute = asyncHandler(async (req, res) => {
  const result = await deleteAdminProject(req.params.id);
  res.json({ success: true, data: result });
});

export const adminReorderProjectsRoute = asyncHandler(async (req, res) => {
  const { items } = validateReorderPayload(req.body);
  const result = await reorderProjects(items);
  res.json({ success: true, data: result });
});
