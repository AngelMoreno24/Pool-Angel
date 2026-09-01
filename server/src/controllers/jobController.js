import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
 
export const createJob = async (req, res, next) => {
 
    try {
 
        const { customerId, propertyId, poolId, title, jobType, frequency, status, defaultTechId, startDate, endDate, price, notes, dayOfWeek } = req.body;
 
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
                dayOfWeek,
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
        
        if (!companyId) {
            return next(createError("Forbidden", 403));
        }
        
        if( role == "OWNER") {
            const jobs = await prisma.job.findMany({
                where: { companyId },
            });
            return res.status(200).json(jobs);
            
        }else if( role == "TECH") {
            //console.log("adfjbfuohhofdu")
            const jobs = await prisma.job.findMany({
                where: { companyId, defaultTechId: req.user.dbUserId },
            });

            //console.log(`Fetched ${jobs.length} jobs for tech ${req.user.dbUserId} with companyId ${companyId}`);
            //console.log("Jobs for tech:", jobs.map(j => ({ id: j.id, title: j.title, dayOfWeek: j.dayOfWeek, routeOrder: j.routeOrder })));
            return res.status(200).json(jobs);
        }
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
        const { companyId, role, id: callerId, authId: callerAuthId } = req.user;
        const { techId } = req.params;
 
        if (!companyId) {
            return next(createError("Forbidden", 403));
        }
 
        if (!techId) {
            return next(createError("Missing required fields", 400));
        }
 
        // FIX: only an OWNER could call this before, which blocked the exact
        // case Route.jsx depends on - a TECH fetching their own jobs. Now:
        // an OWNER can look up any tech in their company, and a TECH can
        // only look up themselves (matched against either id or authId,
        // since the caller might pass either - see the lookup below).
        //
        // NOTE: this assumes req.user carries the caller's own `id` and
        // `authId` (set by requireAuth). If it currently doesn't, this
        // self-check will always fail for techs - confirm requireAuth
        // actually attaches those fields, or adjust accordingly.
        const isSelf = callerId === techId || callerAuthId === techId;
        if (role !== "OWNER" && !isSelf) {
            return next(createError("Forbidden", 403));
        }
 
        // FIX: findUnique can't take companyId alongside id/authId unless
        // that's an explicit compound unique index - this throws at runtime
        // as written. findFirst with an OR handles "techId might be the
        // Prisma User.id OR the Supabase authId" in a single query instead
        // of two sequential ones.
        const tech = await prisma.user.findFirst({
            where: {
                companyId,
                OR: [{ id: techId }, { authId: techId }],
            },
        });
 
        if (!tech) {
            return next(createError("Technician not found", 404));
        }
 
        const jobs = await prisma.job.findMany({
            where: {
                companyId,
                defaultTechId: tech.id,
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
        const { companyId, role, id: callerId, authId: callerAuthId } = req.user;
        // FIX: techId/jobType were being read from req.user, which never has
        // them - they belong on req.params (matching getJobByTech's pattern).
        const { techId } = req.params;
        // Optional ?day=0-6 query param to fetch a single weekday's route -
        // omit it to get every recurring job for this tech across all days.
        const { day } = req.query;
 
        if (!companyId) {
            return next(createError("Forbidden", 403));
        }
 
        if (!techId) {
            return next(createError("Missing required fields", 400));
        }
 
        // Same self-or-owner check as getJobByTech - see the note there
        // about req.user needing id/authId attached.
        const isSelf = callerId === techId || callerAuthId === techId;
        if (role !== "OWNER" && !isSelf) {
            return next(createError("Forbidden", 403));
        }
 
        const tech = await prisma.user.findFirst({
            where: {
                companyId,
                OR: [{ id: techId }, { authId: techId }],
            },
        });
 
        if (!tech) {
            return next(createError("Technician not found", 404));
        }
 
        const jobs = await prisma.job.findMany({
            where: {
                companyId,
                // FIX: Job has no `techId` field - it's `defaultTechId`.
                defaultTechId: tech.id,
                // FIX: RECURRING_CLEANING was a bare, undefined identifier
                // (ReferenceError at runtime) - it needed to be the string
                // value of the enum.
                jobType: "RECURRING_CLEANING",
                ...(day !== undefined ? { dayOfWeek: Number(day) } : {}),
            },
            orderBy: { routeOrder: "asc" },
        });
        console.log(`Fetched ${jobs.length} jobs for tech ${tech.id} on day ${day}`);
        console.log("Jobs:", jobs.map(j => ({ id: j.id, title: j.title, dayOfWeek: j.dayOfWeek, routeOrder: j.routeOrder })));
        return res.status(200).json(jobs);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch jobs", 500, error.message));
    }
 
};
 
 
export const updateJob = async (req, res, next) => {
 
    try {
 
        const { jobId } = req.params;
 
        const { title, jobType, frequency, status, defaultTechId, startDate, endDate, price, notes, routeOrder, dayOfWeek } = req.body;
 
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
                routeOrder,
                dayOfWeek,
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
