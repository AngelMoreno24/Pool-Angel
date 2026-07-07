import express from "express";

import { createPool, getPool, updatePool, deletePool } from "../controllers/poolController.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", createPool);
router.get("/property/:propertyId", getPool);
router.put("/:poolId", updatePool);
router.delete("/:poolId", deletePool);


export default router;