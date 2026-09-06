import { asyncHandler } from "../utils/asyncHandler.js";
import { validateContactPayload } from "../validators/contact.validator.js";
import { submitContact } from "../services/contact.service.js";

export const submitContactRoute = asyncHandler(async (req, res) => {
  const payload = validateContactPayload(req.body);
  const data = await submitContact(payload);
  res.status(201).json({ success: true, data });
});
