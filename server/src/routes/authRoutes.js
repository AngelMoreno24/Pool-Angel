import express from "express";

import { syncUser, getRole } from "../controllers/authController.js";
import { createTech, getTechs, getTech, updateTech, deleteTech } from "../controllers/techController.js";
import requireAuth from "../middleware/requireAuth.js";
import requireSupabaseAuth from "../middleware/requireSupabaseAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { signupSchema, signinSchema } from "../schemas/authSchema.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), (req, res) => {
  res.status(200).json({ message: "Signup payload validated" });
});

router.post("/signin", validate(signinSchema), (req, res) => {
  res.status(200).json({ message: "Signin payload validated" });
});

router.post("/sync", requireSupabaseAuth, syncUser);
router.get("/role", requireAuth, getRole);
router.post("/tech", requireAuth, createTech);
router.get("/tech", requireAuth, getTechs);
router.get("/tech/:technicianId", requireAuth, getTech);
router.put("/tech/:technicianId", requireAuth, updateTech);
router.delete("/tech/:technicianId", requireAuth, deleteTech);

export default router;