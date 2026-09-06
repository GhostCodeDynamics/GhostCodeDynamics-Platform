import { Router } from "express";
import {
  getPosts,
  getPost,
  getPostSection,
} from "../controllers/posts.controller.js";

const router = Router();

router.get("/", getPosts);
router.get("/featured", getPostSection("featured"));
router.get("/editors-picks", getPostSection("editors-picks"));
router.get("/trending", getPostSection("trending"));
router.get("/:slug", getPost);

export default router;
