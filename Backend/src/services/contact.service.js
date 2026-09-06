import Contact from "../models/Contact.js";
import { sendEmail } from "./email.service.js";
import { contactAcknowledgement, contactNotification } from "../emails/index.js";
import env from "../config/env.js";

export async function submitContact({ name, email, phone, topic, message }) {
  const contact = await Contact.create({
    name,
    email,
    phone,
    topic,
    message,
    status: "new",
  });

  // Fire-and-forget: send acknowledgement to visitor and notification to admin.
  // Email failures are logged but never propagated to the caller — the contact
  // submission is already persisted successfully.
  sendEmail({
    to: email,
    ...contactAcknowledgement({ name, topic }),
  }).catch(() => {});

  const adminEmail = env.adminEmail;
  if (adminEmail) {
    sendEmail({
      to: adminEmail,
      ...contactNotification({ name, email, phone, topic, message }),
    }).catch(() => {});
  }

  return {
    id: contact._id,
    topic: contact.topic,
    createdAt: contact.createdAt,
  };
}
