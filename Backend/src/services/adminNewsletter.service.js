import Subscriber from "../models/Subscriber.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "../validators/common.js";

function assertValidId(id) {
  if (!isValidObjectId(String(id))) {
    throw new ApiError(400, "Invalid subscriber id", [
      { field: "id", message: "id must be a valid subscriber id" },
    ]);
  }
}

export async function listSubscribers({ page = 1, limit = 20, status, search } = {}) {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.email = re;
  }

  const [items, total] = await Promise.all([
    Subscriber.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-__v")
      .lean(),
    Subscriber.countDocuments(filter),
  ]);

  return { items, total };
}

export async function getSubscriberById(id) {
  assertValidId(id);
  const sub = await Subscriber.findById(id).select("-__v").lean();
  if (!sub) throw new ApiError(404, "Subscriber not found");
  return sub;
}

export async function unsubscribeSubscriber(id) {
  assertValidId(id);
  const updated = await Subscriber.findByIdAndUpdate(
    id,
    { $set: { status: "unsubscribed", unsubscribedAt: new Date() } },
    { new: true, runValidators: true }
  ).select("-__v").lean();
  if (!updated) throw new ApiError(404, "Subscriber not found");
  return updated;
}

export async function deleteSubscriber(id) {
  assertValidId(id);
  const existing = await Subscriber.findById(id).select("_id email").lean();
  if (!existing) throw new ApiError(404, "Subscriber not found");
  await Subscriber.deleteOne({ _id: id });
  return { deleted: true, id: String(existing._id), email: existing.email };
}

export async function subscriberStats() {
  const [total, active, unsubscribed] = await Promise.all([
    Subscriber.countDocuments(),
    Subscriber.countDocuments({ status: "active" }),
    Subscriber.countDocuments({ status: "unsubscribed" }),
  ]);
  return { total, active, unsubscribed };
}
