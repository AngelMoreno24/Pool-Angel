import express from "express";

import { createPool, getPool, updatePool, deletePool } from "../controllers/poolController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { poolSchema, poolUpdateSchema } from "../schema/poolSchema.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", validate(poolSchema), createPool);
router.get("/property/:propertyId", getPool);
router.put("/:poolId", validate(poolUpdateSchema), updatePool);
router.delete("/:poolId", deletePool);


export default router;