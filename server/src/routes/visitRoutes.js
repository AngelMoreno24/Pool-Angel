import express from "express";
 
import { createVisit, getVisits, getPropertyVisits, getVisit, updateVisit, deleteVisit, checkInVisit, completeVisit, skipVisit } from "../controllers/visitController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { visitSchema, visitUpdateSchema, visitCompleteSchema, visitSkipSchema } from "../schema/visitSchema.js";
 
const router = express.Router();
 
router.post("/create", requireAuth, validate(visitSchema), createVisit);
router.get("/getAll", requireAuth, getVisits);
router.get("/property/:propertyId", requireAuth, getPropertyVisits);
router.get("/:visitId", requireAuth, getVisit);
router.post("/:visitId/check-in", requireAuth, checkInVisit);
router.post("/:visitId/complete", requireAuth, validate(visitCompleteSchema), completeVisit);
router.post("/:visitId/skip", requireAuth, validate(visitSkipSchema), skipVisit);
router.put("/update/:visitId", requireAuth, validate(visitUpdateSchema), updateVisit);
router.delete("/delete/:visitId", requireAuth, deleteVisit);
 
 
export default router;