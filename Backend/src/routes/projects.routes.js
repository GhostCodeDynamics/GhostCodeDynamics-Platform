import { Router } from "express";
import { getProjects, getProject } from "../controllers/projects.controller.js";

const router = Router();

router.get("/", getProjects);
router.get("/:slug", getProject);

export default router;
