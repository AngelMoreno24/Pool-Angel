import express from "express";

import { syncUser } from "../controllers/authController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/sync", requireAuth, syncUser);

export default router;