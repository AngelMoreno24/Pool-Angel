import express from "express";

import { syncUser } from "../controllers/authController.js";
import requireSupabaseAuth from "../middleware/requireSupabaseAuth.js";

const router = express.Router();

router.post("/sync", requireSupabaseAuth, syncUser);

export default router;