import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);
const normalizeScheduledDate = (value) => new Date(`${toDateKey(value)}T00:00:00.000Z`);

const allowedTransitions = {
    SCHEDULED: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "SKIPPED", "CANCELLED"],
    IN_PROGRESS: ["IN_PROGRESS", "COMPLETED", "SKIPPED", "CANCELLED"],
    COMPLETED: ["COMPLETED"],
    SKIPPED: ["SKIPPED"],
    CANCELLED: ["CANCELLED"],
};

const isAllowedTransition = (currentStatus, nextStatus) =>
    allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
 
export const createVisit = async (req, res, next) => {
 
    try {
 
        const { jobId, assignedTechId, scheduledDate, scheduledTime, status, notes, serviceData, routeOrder } = req.body;
 
        const { companyId, role, dbUserId } = req.user;
 
        if (!companyId || !["OWNER", "TECH"].includes(role)) {
            return next(createError("Forbidden", 403));
        }

        const nextStatus = status ?? "SCHEDULED";
        if (role === "TECH" && nextStatus !== "SCHEDULED") {
            return next(createError("Technicians must start visits from SCHEDULED", 403));
        }
 
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (!job || job.companyId !== companyId) {
            return next(createError("Invalid job", 400));
        }

        if (role === "TECH") {
            const allowedTechId = assignedTechId ?? job.defaultTechId ?? dbUserId;
            if (!allowedTechId || allowedTechId !== dbUserId) {
                return next(createError("Forbidden", 403));
            }
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
                assignedTechId: role === "TECH" ? dbUserId : (assignedTechId ?? dbUserId),
                scheduledDate: normalizeScheduledDate(scheduledDate),
                scheduledDateKey: toDateKey(scheduledDate),
                scheduledTime,
                status: nextStatus,
                notes,
                serviceData,
                routeOrder,
            },
        });
 
        return res.status(201).json(visit);
    } catch (error) {
        console.error(error);
        if (error?.code === "P2002") {
            return next(createError("A visit already exists for this job on that date", 409));
        }
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
            where: role === "TECH"
                ? { companyId, assignedTechId: req.user.dbUserId }
                : { companyId },
            orderBy: { scheduledDate: "asc" },
        });
        return res.status(200).json(visits);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch visits", 500, error.message));
    }
 
};

export const getPropertyVisits = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { companyId, role, dbUserId } = req.user;

        if (!companyId || !propertyId) {
            return next(createError("Missing required fields", 400));
        }

        const property = await prisma.property.findFirst({
            where: { id: propertyId, companyId },
            select: { id: true },
        });
        if (!property) return next(createError("Property not found", 404));

        const visits = await prisma.visit.findMany({
            where: {
                companyId,
                job: { propertyId },
                ...(role === "TECH" ? { assignedTechId: dbUserId } : {}),
            },
            include: {
                job: { select: { id: true, title: true } },
            },
            orderBy: { scheduledDate: "desc" },
        });

        return res.status(200).json(visits);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch property visit history", 500, error.message));
    }
};
 
 
export const getVisit = async (req, res, next) => {
 
    try {
 
        const { visitId } = req.params;
 
        const { companyId, role } = req.user;
 
        if (!companyId || !["OWNER", "TECH"].includes(role)) {
            return next(createError("Forbidden", 403));
        }
 
        if (!visitId) {
            return next(createError("Missing required fields", 400));
        }
 
        const visit = await prisma.visit.findUnique({
            where: { id: visitId },
        });
 
        if (!visit || visit.companyId !== companyId || (role === "TECH" && visit.assignedTechId !== req.user.dbUserId)) {
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
 
        const { companyId, role, dbUserId } = req.user;
 
        if (!companyId) {
            return next(createError("Forbidden", 403));
        }
 
        if (!visitId) {
            return next(createError("Missing required fields", 400));
        }

        const existingVisit = await prisma.visit.findUnique({ where: { id: visitId } });
        if (!existingVisit || existingVisit.companyId !== companyId) {
            return next(createError("Visit not found", 404));
        }

        if (role === "TECH") {
            if (assignedTechId !== undefined || scheduledDate !== undefined || scheduledTime !== undefined || status !== undefined || routeOrder !== undefined) {
                return next(createError("Technicians must use the visit workflow actions", 403));
            }
            const currentTechId = existingVisit.assignedTechId ?? (await prisma.job.findUnique({ where: { id: existingVisit.jobId }, select: { defaultTechId: true } }))?.defaultTechId;
            if (currentTechId !== dbUserId) {
                return next(createError("Forbidden", 403));
            }
            if (assignedTechId && assignedTechId !== dbUserId) {
                return next(createError("Forbidden", 403));
            }
        }

        if (status !== undefined && !isAllowedTransition(existingVisit.status, status)) {
            return next(createError(`Cannot change a ${existingVisit.status} visit to ${status}`, 409));
        }

        const nextScheduledDate = scheduledDate === undefined
            ? existingVisit.scheduledDate
            : normalizeScheduledDate(scheduledDate);
 
        if (assignedTechId) {
            const tech = await prisma.user.findUnique({ where: { id: assignedTechId } });
            if (!tech || tech.companyId !== companyId) {
                return next(createError("Invalid technician", 400));
            }
        }
 
        const updated = await prisma.visit.update({
            where: { id: visitId },
            data: {
                assignedTechId: role === "TECH" ? (assignedTechId ?? existingVisit.assignedTechId ?? dbUserId) : (assignedTechId ?? existingVisit.assignedTechId ?? dbUserId),
                scheduledDate: nextScheduledDate,
                scheduledDateKey: toDateKey(nextScheduledDate),
                scheduledTime,
                status,
                notes,
                serviceData,
                routeOrder,
            },
        });
 
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        if (error?.code === "P2002") {
            return next(createError("A visit already exists for this job on that date", 409));
        }
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

const getTechnicianVisit = async (visitId, companyId, role, dbUserId) => {
    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit || visit.companyId !== companyId || (role === "TECH" && visit.assignedTechId !== dbUserId)) {
        return null;
    }
    return visit;
};

export const checkInVisit = async (req, res, next) => {
    try {
        const { companyId, role, dbUserId } = req.user;
        const visit = await getTechnicianVisit(req.params.visitId, companyId, role, dbUserId);
        if (!visit) return next(createError("Visit not found", 404));
        if (!["SCHEDULED", "IN_PROGRESS"].includes(visit.status)) {
            return next(createError("This visit cannot be checked in", 400));
        }

        const updated = await prisma.visit.update({
            where: { id: visit.id },
            data: { status: "IN_PROGRESS", checkInAt: visit.checkInAt ?? new Date() },
        });
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to check in visit", 500, error.message));
    }
};

export const completeVisit = async (req, res, next) => {
    try {
        const { companyId, role, dbUserId } = req.user;
        const visit = await getTechnicianVisit(req.params.visitId, companyId, role, dbUserId);
        if (!visit) return next(createError("Visit not found", 404));
        if (["SKIPPED", "CANCELLED"].includes(visit.status)) {
            return next(createError("This visit cannot be completed", 400));
        }

        const { notes, readings } = req.body;
        const updated = await prisma.visit.update({
            where: { id: visit.id },
            data: {
                status: "COMPLETED",
                checkInAt: visit.checkInAt ?? new Date(),
                checkOutAt: new Date(),
                notes: notes || visit.notes,
                serviceData: { ...(visit.serviceData || {}), readings: readings || {}, completedAt: new Date().toISOString() },
            },
        });
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to complete visit", 500, error.message));
    }
};

export const skipVisit = async (req, res, next) => {
    try {
        const { companyId, role, dbUserId } = req.user;
        const visit = await getTechnicianVisit(req.params.visitId, companyId, role, dbUserId);
        if (!visit) return next(createError("Visit not found", 404));
        if (["COMPLETED", "CANCELLED"].includes(visit.status)) {
            return next(createError("This visit cannot be skipped", 400));
        }

        const updated = await prisma.visit.update({
            where: { id: visit.id },
            data: { status: "SKIPPED", notes: req.body.reason },
        });
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to skip visit", 500, error.message));
    }
};

export const rescheduleVisit = async (req, res, next) => {
    try {
        const { visitId } = req.params;
        const { scheduledDate, scheduledTime, assignedTechId } = req.body;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") return next(createError("Forbidden", 403));

        const existingVisit = await prisma.visit.findFirst({ where: { id: visitId, companyId } });
        if (!existingVisit) return next(createError("Visit not found", 404));
        if (!["SKIPPED", "CANCELLED"].includes(existingVisit.status)) {
            return next(createError("Only skipped or cancelled visits can be rescheduled", 409));
        }

        if (assignedTechId) {
            const tech = await prisma.user.findFirst({ where: { id: assignedTechId, companyId } });
            if (!tech) return next(createError("Invalid technician", 400));
        }

        const updated = await prisma.visit.update({
            where: { id: existingVisit.id },
            data: {
                scheduledDate: normalizeScheduledDate(scheduledDate),
                scheduledDateKey: toDateKey(scheduledDate),
                scheduledTime,
                assignedTechId: assignedTechId ?? existingVisit.assignedTechId,
                status: "SCHEDULED",
                checkInAt: null,
                checkOutAt: null,
            },
        });
        return res.status(200).json(updated);
    } catch (error) {
        console.error(error);
        if (error?.code === "P2002") return next(createError("A visit already exists for this job on that date", 409));
        return next(createError("Failed to reschedule visit", 500, error.message));
    }
};

export const generateJobVisits = async (req, res, next) => {
    try {
        const { jobId } = req.params;
        const { from, through } = req.body;
        const { companyId, role, dbUserId } = req.user;

        if (!companyId || role !== "OWNER") return next(createError("Forbidden", 403));

        const job = await prisma.job.findFirst({ where: { id: jobId, companyId } });
        if (!job) return next(createError("Job not found", 404));
        if (job.status !== "ACTIVE") return next(createError("Only active jobs can generate visits", 409));

        const start = normalizeScheduledDate(from < job.startDate ? job.startDate : from);
        const requestedEnd = normalizeScheduledDate(through);
        const end = job.endDate && job.endDate < requestedEnd ? normalizeScheduledDate(job.endDate) : requestedEnd;
        const dayLimit = Math.ceil((end - start) / 86400000) + 1;
        if (dayLimit > 367) return next(createError("Visit generation is limited to one year", 400));
        if (end < start) return res.status(200).json({ created: 0, skipped: 0, visits: [] });

        const dates = [];
        for (let index = 0; index < dayLimit; index += 1) {
            const date = new Date(start);
            date.setUTCDate(start.getUTCDate() + index);
            const diffDays = Math.round((date - normalizeScheduledDate(job.startDate)) / 86400000);
            const frequency = job.frequency;
            const occurs = !frequency || frequency === "ONE_TIME"
                ? diffDays === 0
                : frequency === "WEEKLY"
                    ? diffDays >= 0 && diffDays % 7 === 0
                    : frequency === "BIWEEKLY"
                        ? diffDays >= 0 && diffDays % 14 === 0
                        : diffDays >= 0 && diffDays % 28 === 0;
            if (occurs) dates.push(date);
        }

        const result = await prisma.visit.createMany({
            data: dates.map((date) => ({
                companyId,
                jobId,
                assignedTechId: job.defaultTechId ?? dbUserId,
                scheduledDate: date,
                scheduledDateKey: toDateKey(date),
                status: "SCHEDULED",
            })),
            skipDuplicates: true,
        });

        return res.status(201).json({ created: result.count, skipped: dates.length - result.count, dates: dates.map(toDateKey) });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to generate visits", 500, error.message));
    }
};
