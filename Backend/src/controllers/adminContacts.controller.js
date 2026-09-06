import { asyncHandler } from "../utils/asyncHandler.js";
import { paginationMeta } from "../utils/paginate.js";
import { parsePagination } from "../validators/common.js";
import {
  listContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
  contactStats,
} from "../services/adminContacts.service.js";

export const adminListContactsRoute = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const status = req.query.status || undefined;
  const search = req.query.search || undefined;
  const { items, total } = await listContacts({ page, limit, status, search });
  res.json({
    success: true,
    data: items,
    meta: paginationMeta({ page, limit, total }),
  });
});

export const adminGetContactRoute = asyncHandler(async (req, res) => {
  const contact = await getContactById(req.params.id);
  res.json({ success: true, data: contact });
});

export const adminUpdateContactStatusRoute = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, message: "status is required" });
  }
  const contact = await updateContactStatus(req.params.id, status);
  res.json({ success: true, data: contact });
});

export const adminDeleteContactRoute = asyncHandler(async (req, res) => {
  const result = await deleteContact(req.params.id);
  res.json({ success: true, data: result });
});

export const adminContactStatsRoute = asyncHandler(async (req, res) => {
  const stats = await contactStats();
  res.json({ success: true, data: stats });
});
