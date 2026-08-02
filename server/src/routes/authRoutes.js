import express from "express";

import { syncUser } from "../controllers/authController.js";
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

export default router;