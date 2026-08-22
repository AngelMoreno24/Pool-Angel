import express from "express";
 
import { createJob, getJobs, getJob, getJobByTech, getJobForRoute, updateJob, deleteJob } from "../controllers/jobController.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { jobSchema, jobUpdateSchema } from "../schema/jobSchema.js";
 
const router = express.Router();
 
router.post("/create", requireAuth, validate(jobSchema), createJob);
router.get("/getAll", requireAuth, getJobs);
router.get("/:jobId", requireAuth, getJob);
router.get("/getByTech/:techId", requireAuth, getJobByTech);
router.get("/getForRoute/:techId", requireAuth, getJobForRoute);
router.put("/update/:jobId", requireAuth, validate(jobUpdateSchema), updateJob);
router.delete("/delete/:jobId", requireAuth, deleteJob);
 
 
export default router;