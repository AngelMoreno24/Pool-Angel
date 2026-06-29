import express from "express";

import { createProperty, getProperties, getProperty, updateProperty, deleteProperty } from "../controllers/propertyController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createProperty);
router.get("/customer/:customerId", getProperties);
router.get("/:propertyId", getProperty);
router.put("/:propertyId", updateProperty);
router.delete("/:propertyId", deleteProperty);


export default router;