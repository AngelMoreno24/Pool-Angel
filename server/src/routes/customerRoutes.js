import express from "express";

import { createCustomer, getCustomers } from "../controllers/customerController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/create", requireAuth, createCustomer);
router.get("/getCustomers", requireAuth, getCustomers);

export default router;