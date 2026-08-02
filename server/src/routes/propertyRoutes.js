import express from "express";

import { createProperty, getProperties, getProperty, updateProperty, deleteProperty } from "../controllers/propertyController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { propertySchema, propertyUpdateSchema } from "../schema/propertySchema.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", validate(propertySchema), createProperty);
router.get("/customer/:customerId", getProperties);
router.get("/:propertyId", getProperty);
router.put("/:propertyId", validate(propertyUpdateSchema), updateProperty);
router.delete("/:propertyId", deleteProperty);


export default router;