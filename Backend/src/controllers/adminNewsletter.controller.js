import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationMeta } from "../utils/paginate.js";
import { parsePagination } from "../validators/common.js";
import {
  listSubscribers,
  getSubscriberById,
  unsubscribeSubscriber,
  deleteSubscriber,
  subscriberStats,
} from "../services/adminNewsletter.service.js";

export const adminListSubscribersRoute = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const status = req.query.status || undefined;
  const search = req.query.search || undefined;
  const { items, total } = await listSubscribers({ page, limit, status, search });
  res.json({
    success: true,
    data: items,
    meta: paginationMeta({ page, limit, total }),
  });
});

export const adminGetSubscriberRoute = asyncHandler(async (req, res) => {
  const subscriber = await getSubscriberById(req.params.id);
  res.json({ success: true, data: subscriber });
});

export const adminUnsubscribeRoute = asyncHandler(async (req, res) => {
  const subscriber = await unsubscribeSubscriber(req.params.id);
  res.json({ success: true, data: subscriber });
});

export const adminDeleteSubscriberRoute = asyncHandler(async (req, res) => {
  const result = await deleteSubscriber(req.params.id);
  res.json({ success: true, data: result });
});

export const adminSubscriberStatsRoute = asyncHandler(async (req, res) => {
  const stats = await subscriberStats();
  res.json({ success: true, data: stats });
});
