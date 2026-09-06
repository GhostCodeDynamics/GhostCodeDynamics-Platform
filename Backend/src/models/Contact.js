import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 160,
    },
    phone: { type: String, required: true, trim: true, maxlength: 15 },
    topic: {
      type: String,
      enum: ["project", "mentorship", "collab", "other"],
      default: "project",
    },
    message: { type: String, required: true, maxlength: 1500 },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
      index: true,
    },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
