import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
 
export const createJob = async (req, res, next) => {
 
    try {
 
        const { customerId, propertyId, poolId, title, jobType, frequency, status, defaultTechId, startDate, endDate, price, notes } = req.body;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        // A Job links across Customer/Property/Pool/User, unlike Customer which
        // stands alone - confirm every referenced record actually belongs to
        // this company (and to each other) before creating the job.
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: { pool: true },
        });
 
        if (!property || property.companyId !== companyId || property.customerId !== customerId) {
            return next(createError("Invalid property for this customer", 400));
        }
 
        if (poolId && property.pool?.id !== poolId) {
            return next(createError("Invalid pool for this property", 400));
        }
 
        if (defaultTechId) {
            const tech = await prisma.user.findUnique({ where: { id: defaultTechId } });
            if (!tech || tech.companyId !== companyId) {
                return next(createError("Invalid technician", 400));
            }
        }
 
        const job = await prisma.job.create({
            data: {
                companyId,
                customerId,
                propertyId,
                poolId,
                title,
                jobType,
                frequency,
                status,
                defaultTechId,
                startDate,
                endDate,
                price,
                notes,
            },
        });
 
        return res.status(201).json(job);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to create job", 500, error.message));
    }
 
};
 
export const getJobs = async (req, res, next) => {
 
    try {
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        const jobs = await prisma.job.findMany({
            where: { companyId },
        });
        return res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch jobs", 500, error.message));
    }
 
};
 
 
export const getJob = async (req, res, next) => {
 
    try {
 
        const { jobId } = req.params;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!jobId) {
            return next(createError("Missing required fields", 400));
        }
 
        const job = await prisma.job.findUnique({
            where: { id: jobId },
        });
 
        if (!job || job.companyId !== companyId) {
            return next(createError("Job not found", 404));
        }
 
        return res.status(200).json(job);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch job", 500, error.message));
    }
 
};
 

export const getJobByTech = async (req, res, next) => {
 
    try {
        const { companyId, role } = req.user;
        const { techId } = req.params;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!techId) {
            return next(createError("Missing required fields", 400));
        }
 
            
        var verify = await prisma.user.findUnique({
            where: { 
                companyId,
                id: techId 
            },
        });
        
        if(!verify){
            verify = await prisma.user.findUnique({
                where: { 
                    companyId,
                    authId: techId 
                },
            });
        }

        console.log(verify)
 
        if(!verify ){
            return next(createError("Technician not found", 404));
        }     
        const jobs = await prisma.job.findMany({
            where: { 
                companyId,
                defaultTechId: verify.id,
            },
        });
        return res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch jobs", 500, error.message));
    }
 
};
export const getJobForRoute = async (req, res, next) => {
 
    try {
        const { companyId, role, techId, jobType } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!techId) {
            return next(createError("Missing required fields", 400));
        }
 
        const verify = await prisma.user.findMany({
            where: { 
                companyId,
                id: techId
              },
        });
 
        if(!verify || verify.length === 0){
            return next(createError("Technician not found", 404));
        }    
        const jobs = await prisma.job.findMany({
            where: { 
                companyId,
                techId: techId,
                jobType: RECURRING_CLEANING
            },
        });
        return res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch jobs", 500, error.message));
    }
 
};
 

export const updateJob = async (req, res, next) => {
 
    try {
 
        const { jobId } = req.params;
 
        const { title, jobType, frequency, status, defaultTechId, startDate, endDate, price, notes } = req.body;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!jobId) {
            return next(createError("Missing required fields", 400));
        }
 
        // customerId/propertyId/poolId are intentionally not editable here -
        // reassigning a job to a different property is a bigger operation
        // than a field update (would need the same ownership checks as
        // createJob). Delete and recreate the job for that case.
        if (defaultTechId) {
            const tech = await prisma.user.findUnique({ where: { id: defaultTechId } });
            if (!tech || tech.companyId !== companyId) {
                return next(createError("Invalid technician", 400));
            }
        }
 
        const result = await prisma.job.updateMany({
            where: {
                id: jobId,
                companyId,
            },
            data: {
                title,
                jobType,
                frequency,
                status,
                defaultTechId,
                startDate,
                endDate,
                price,
                notes,
            },
        });
 
        if (result.count === 0) {
            return next(createError("Job not found", 404));
        }
 
        return res.status(200).json({ message: "Job updated successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to update job", 500, error.message));
    }
 
};
 
 
export const deleteJob = async (req, res, next) => {
 
    try {
 
        const { jobId } = req.params;
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!jobId) {
            return next(createError("Missing required fields", 400));
        }
 
        const result = await prisma.job.deleteMany({
            where: {
                id: jobId,
                companyId,
            },
        });
 
        if (result.count === 0) {
            return next(createError("Job not found", 404));
        }
 
        return res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to delete job", 500, error.message));
    }
 
};
