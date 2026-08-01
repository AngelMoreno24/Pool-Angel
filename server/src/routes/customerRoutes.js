import express from "express";
 
import { createCustomer, getCustomers, getCustomer, updateCustomer, deleteCustomer } from "../controllers/customerController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { customerSchema, customerUpdateSchema } from "../schema/customerSchema.js";
 
const router = express.Router();
 
router.post("/create", requireAuth, validate(customerSchema), createCustomer);
router.get("/getAll", requireAuth, getCustomers);
router.get("/:customerId", requireAuth, getCustomer);
router.put("/update/:customerId", requireAuth, validate(customerUpdateSchema), updateCustomer);
router.delete("/delete/:customerId", requireAuth, deleteCustomer);
 
 
export default router;
 