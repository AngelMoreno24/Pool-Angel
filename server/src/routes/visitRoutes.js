import express from "express";
 
import { createVisit, getVisits, getVisit, updateVisit, deleteVisit } from "../controllers/visitController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { visitSchema, visitUpdateSchema } from "../schema/visitSchema.js";
 
const router = express.Router();
 
router.post("/create", requireAuth, validate(visitSchema), createVisit);
router.get("/getAll", requireAuth, getVisits);
router.get("/:visitId", requireAuth, getVisit);
router.put("/update/:visitId", requireAuth, validate(visitUpdateSchema), updateVisit);
router.delete("/delete/:visitId", requireAuth, deleteVisit);
 
 
export default router;