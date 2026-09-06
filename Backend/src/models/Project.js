import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: { type: String, required: true, index: true },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    problem: { type: String, default: "" },
    solution: { type: String, default: "" },
    tech: { type: [String], default: [] },
    liveUrl: { type: String, default: "" },
    repoUrl: { type: String, default: "" },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0, index: true },
    publishedAt: { type: Date, index: true },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
