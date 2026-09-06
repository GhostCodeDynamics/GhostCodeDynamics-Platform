import Subscriber from "../models/Subscriber.js";
import { sendEmail } from "./email.service.js";
import { newsletterWelcome } from "../emails/index.js";

const DUPLICATE_KEY = 11000;

export async function subscribe(email) {
  let isNew = false;
  try {
    const result = await Subscriber.findOneAndUpdate(
      { email },
      { $set: { status: "active", unsubscribedAt: null } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    // If the subscriber was just created (no createdAt difference means new)
    isNew = result && result.createdAt && result.createdAt.getTime() === result.updatedAt.getTime();
  } catch (err) {
    if (!(err && err.name === "MongoServerError" && err.code === DUPLICATE_KEY)) {
      throw err;
    }
    await Subscriber.findOneAndUpdate(
      { email },
      { $set: { status: "active", unsubscribedAt: null } },
      { returnDocument: "after" }
    );
  }

  // Fire-and-forget: send welcome email to new subscribers only.
  // Never break the subscription flow if email fails.
  if (isNew) {
    sendEmail({
      to: email,
      ...newsletterWelcome({ email }),
    }).catch(() => {});
  }

  return { subscribed: true };
}

export async function unsubscribe(email) {
  await Subscriber.updateOne(
    { email, status: "active" },
    { $set: { status: "unsubscribed", unsubscribedAt: new Date() } }
  );
  return { unsubscribed: true };
}
