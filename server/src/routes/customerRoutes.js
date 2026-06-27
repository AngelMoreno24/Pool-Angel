import express from "express";

import { createCustomer, getCustomers, getCustomer, updateCustomer } from "../controllers/customerController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/create", requireAuth, createCustomer);
router.get("/getAll", requireAuth, getCustomers);
router.get("/:customerId", requireAuth, getCustomer);
router.put("/update/:customerId", requireAuth, updateCustomer);


export default router;