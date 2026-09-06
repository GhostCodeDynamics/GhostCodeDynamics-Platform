import { asyncHandler } from "../utils/asyncHandler.js";
import { validateEmailBody } from "../validators/newsletter.validator.js";
import { subscribe, unsubscribe } from "../services/newsletter.service.js";

export const subscribeRoute = asyncHandler(async (req, res) => {
  const email = validateEmailBody(req.body);
  const data = await subscribe(email);
  res.status(201).json({ success: true, data });
});

export const unsubscribeRoute = asyncHandler(async (req, res) => {
  const email = validateEmailBody(req.body);
  const data = await unsubscribe(email);
  res.json({ success: true, data });
});
