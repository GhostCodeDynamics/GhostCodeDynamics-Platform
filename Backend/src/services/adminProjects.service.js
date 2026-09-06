import Project from "../models/Project.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "../validators/common.js";
import { slugFromName } from "../validators/adminProjects.validator.js";

/**
 * Admin project management for /api/admin/projects.
 * The public service already returns ALL projects (no published filter);
 * the admin namespace adds full CRUD plus explicit ordering.
 */

const PUBLIC_SORT = { order: 1, publishedAt: -1, _id: 1 };

function assertValidId(id) {
  if (!isValidObjectId(String(id))) {
    throw new ApiError(400, "Invalid project id", [
      { field: "id", message: "id must be a valid project id" },
    ]);
  }
}

export async function listAdminProjects() {
  return Project.find().sort(PUBLIC_SORT).select("-__v").lean();
}

export async function getAdminProjectById(id) {
  assertValidId(id);
  const project = await Project.findById(id).select("-__v").lean();
  if (!project) throw new ApiError(404, "Project not found");
  return project;
}

async function assertSlugAvailable(slug, excludeId) {
  const clash = await Project.findOne({ slug }).select("_id").lean();
  if (clash && String(clash._id) !== String(excludeId)) {
    throw new ApiError(409, "Slug already in use", [
      { field: "slug", message: "another project already uses this slug" },
    ]);
  }
}

export async function createAdminProject(data) {
  let slug = data.slug ?? slugFromName(data.name);
  if (!slug) {
    throw new ApiError(400, "Could not derive a slug from the name", [
      { field: "slug", message: "provide an explicit slug" },
    ]);
  }
  await assertSlugAvailable(slug);

  try {
    const doc = await Project.create({
      ...data,
      ...(data.publishedAt === undefined && { publishedAt: null }),
      ...(data.order === undefined && { order: 0 }),
      slug,
    });
    return doc.toObject();
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.slug) {
      throw new ApiError(409, "Slug already in use", [
        { field: "slug", message: "another project already uses this slug" },
      ]);
    }
    throw err;
  }
}

export async function updateAdminProject(id, patch) {
  assertValidId(id);
  if (patch.slug) await assertSlugAvailable(patch.slug, id);

  try {
    const updated = await Project.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) throw new ApiError(404, "Project not found");
    return updated;
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.slug) {
      throw new ApiError(409, "Slug already in use", [
        { field: "slug", message: "another project already uses this slug" },
      ]);
    }
    throw err;
  }
}

export async function deleteAdminProject(id) {
  assertValidId(id);
  const existing = await Project.findById(id).select("slug name").lean();
  if (!existing) throw new ApiError(404, "Project not found");

  await Project.deleteOne({ _id: id });
  return {
    deleted: true,
    id: String(existing._id),
    slug: existing.slug,
    name: existing.name,
  };
}

/**
 * Applies a validated complete ordering ({items:[{id, order}]}) via a
 * single ordered bulkWrite. Standalone MongoDB has no multi-document
 * transactions; each individual update is atomic and the payload was
 * fully pre-validated (complete coverage, unique orders), so the final
 * state is always consistent with the requested ordering.
 */
export async function reorderProjects(items) {
  const ids = items.map((i) => i.id);

  const total = await Project.countDocuments({});
  if (total !== items.length) {
    throw new ApiError(400, "Reorder must include every project exactly once", [
      {
        field: "items",
        message: `expected ${total} item(s) covering every project, received ${items.length}`,
      },
    ]);
  }

  const existing = await Project.find({ _id: { $in: ids } }).select("_id").lean();
  if (existing.length !== ids.length) {
    const known = new Set(existing.map((d) => String(d._id)));
    const unknown = ids.filter((id) => !known.has(String(id)));
    throw new ApiError(400, "Unknown project id(s) in reorder list", [
      { field: "items", message: `unknown id(s): ${unknown.join(", ")}` },
    ]);
  }

  await Project.bulkWrite(
    items.map(({ id, order }) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order } } },
    })),
    { ordered: true }
  );

  return { updated: items.length };
}
