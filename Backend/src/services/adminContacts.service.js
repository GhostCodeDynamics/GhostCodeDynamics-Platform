import Contact from "../models/Contact.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "../validators/common.js";

function assertValidId(id) {
  if (!isValidObjectId(String(id))) {
    throw new ApiError(400, "Invalid contact id", [
      { field: "id", message: "id must be a valid contact id" },
    ]);
  }
}

export async function listContacts({ page = 1, limit = 20, status, search } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: re }, { email: re }, { message: re }];
  }

  const [items, total] = await Promise.all([
    Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v")
      .lean(),
    Contact.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getContactById(id) {
  assertValidId(id);
  const contact = await Contact.findById(id).select("-__v").lean();
  if (!contact) throw new ApiError(404, "Contact not found");
  return contact;
}

export async function updateContactStatus(id, status) {
  assertValidId(id);
  const valid = ["new", "read", "replied", "archived"];
  if (!valid.includes(status)) {
    throw new ApiError(400, "Invalid status", [
      { field: "status", message: `status must be one of: ${valid.join(", ")}` },
    ]);
  }
  const updated = await Contact.findByIdAndUpdate(
    id,
    { $set: { status } },
    { new: true, runValidators: true }
  ).select("-__v").lean();
  if (!updated) throw new ApiError(404, "Contact not found");
  return updated;
}

export async function deleteContact(id) {
  assertValidId(id);
  const existing = await Contact.findById(id).select("_id name email").lean();
  if (!existing) throw new ApiError(404, "Contact not found");
  await Contact.deleteOne({ _id: id });
  return { deleted: true, id: String(existing._id), name: existing.name, email: existing.email };
}

export async function contactStats() {
  const [total, newCount, read, replied, archived] = await Promise.all([
    Contact.countDocuments(),
    Contact.countDocuments({ status: "new" }),
    Contact.countDocuments({ status: "read" }),
    Contact.countDocuments({ status: "replied" }),
    Contact.countDocuments({ status: "archived" }),
  ]);
  return { total, new: newCount, read, replied, archived };
}
