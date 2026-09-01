import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
 
export const createVisit = async (req, res, next) => {
 
    try {
 
        const { jobId, assignedTechId, scheduledDate, scheduledTime, status, notes, serviceData, routeOrder } = req.body;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        // Confirm the job actually belongs to this company before attaching
        // a visit to it.
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.companyId !== companyId) {
            return next(createError("Invalid job", 400));
        }
 
        if (assignedTechId) {
            const tech = await prisma.user.findUnique({ where: { id: assignedTechId } });
            if (!tech || tech.companyId !== companyId) {
                return next(createError("Invalid technician", 400));
            }
        }
 
        const visit = await prisma.visit.create({
            data: {
                companyId,
                jobId,
                assignedTechId,
                scheduledDate,
                scheduledTime,
                status,
                notes,
                serviceData,
                routeOrder,
            },
        });
 
        return res.status(201).json(visit);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to create visit", 500, error.message));
    }
 
};
 
export const getVisits = async (req, res, next) => {
 
    try {
        const { companyId, role } = req.user;
 
        if (!companyId ) {
            return next(createError("Forbidden", 403));
        }
 
        const visits = await prisma.visit.findMany({
            where: { companyId },
            orderBy: { scheduledDate: "asc" },
        });
        return res.status(200).json(visits);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch visits", 500, error.message));
    }
 
};
 
 
export const getVisit = async (req, res, next) => {
 
    try {
 
        const { visitId } = req.params;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!visitId) {
            return next(createError("Missing required fields", 400));
        }
 
        const visit = await prisma.visit.findUnique({
            where: { id: visitId },
        });
 
        if (!visit || visit.companyId !== companyId) {
            return next(createError("Visit not found", 404));
        }
 
        return res.status(200).json(visit);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch visit", 500, error.message));
    }
 
};
 
 
export const updateVisit = async (req, res, next) => {
 
    try {
 
        const { visitId } = req.params;
 
        const { assignedTechId, scheduledDate, scheduledTime, status, notes, serviceData, routeOrder } = req.body;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!visitId) {
            return next(createError("Missing required fields", 400));
        }
 
        if (assignedTechId) {
            const tech = await prisma.user.findUnique({ where: { id: assignedTechId } });
            if (!tech || tech.companyId !== companyId) {
                return next(createError("Invalid technician", 400));
            }
        }
 
        const result = await prisma.visit.updateMany({
            where: {
                id: visitId,
                companyId,
            },
            data: {
                assignedTechId,
                scheduledDate,
                scheduledTime,
                status,
                notes,
                serviceData,
                routeOrder,
            },
        });
 
        if (result.count === 0) {
            return next(createError("Visit not found", 404));
        }
 
        return res.status(200).json({ message: "Visit updated successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to update visit", 500, error.message));
    }
 
};
 
 
export const deleteVisit = async (req, res, next) => {
 
    try {
 
        const { visitId } = req.params;
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!visitId) {
            return next(createError("Missing required fields", 400));
        }
 
        const result = await prisma.visit.deleteMany({
            where: {
                id: visitId,
                companyId,
            },
        });
 
        if (result.count === 0) {
            return next(createError("Visit not found", 404));
        }
 
        return res.status(200).json({ message: "Visit deleted successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to delete visit", 500, error.message));
    }
 
};
