import express from "express";
 
import { createVisit, getVisits, getPropertyVisits, getVisit, updateVisit, deleteVisit, checkInVisit, completeVisit, skipVisit, rescheduleVisit, generateJobVisits } from "../controllers/visitController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { visitSchema, visitUpdateSchema, visitCompleteSchema, visitSkipSchema, visitRescheduleSchema, generateVisitsSchema } from "../schema/visitSchema.js";
 
const router = express.Router();
 
router.post("/create", requireAuth, validate(visitSchema), createVisit);
router.get("/getAll", requireAuth, getVisits);
router.get("/property/:propertyId", requireAuth, getPropertyVisits);
router.post("/job/:jobId/generate", requireAuth, validate(generateVisitsSchema), generateJobVisits);
router.get("/:visitId", requireAuth, getVisit);
router.post("/:visitId/check-in", requireAuth, checkInVisit);
router.post("/:visitId/complete", requireAuth, validate(visitCompleteSchema), completeVisit);
router.post("/:visitId/skip", requireAuth, validate(visitSkipSchema), skipVisit);
router.post("/:visitId/reschedule", requireAuth, validate(visitRescheduleSchema), rescheduleVisit);
router.put("/update/:visitId", requireAuth, validate(visitUpdateSchema), updateVisit);
router.delete("/delete/:visitId", requireAuth, deleteVisit);
 
 
export default router;