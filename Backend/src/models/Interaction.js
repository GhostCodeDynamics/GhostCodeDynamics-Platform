import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    kind: { type: String, required: true, enum: ["like", "bookmark"] },
    postSlug: { type: String, required: true, index: true },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    actorId: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

interactionSchema.index(
  { postSlug: 1, commentId: 1, kind: 1, actorId: 1 },
  { unique: true }
);

const Interaction = mongoose.model("Interaction", interactionSchema);

export default Interaction;
