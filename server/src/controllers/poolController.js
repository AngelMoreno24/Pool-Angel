import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

export const createPool = async (req, res, next) => {

    try {
        const { propertyId, type, size, notes } = req.body;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!propertyId || !companyId) {
            return next(createError("Missing required fields", 400));
        }

        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                companyId,
            },
        });

        if (!property) {
            return next(createError("Property not found", 404));
        }

        const existingPool = await prisma.pool.findFirst({
            where: {
                propertyId,
            },
        });

        if (existingPool) {
            return next(createError("This property already has a pool.", 409));
        }

        const pool = await prisma.pool.create({
            data: {
                propertyId,
                companyId,
                type,
                size,
                notes,
            },
        });

        return res.status(201).json(pool);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to create pool", 500, error.message));
    }

};

export const getPool = async (req, res, next) => {

    try {
        const { propertyId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!propertyId) {
            return next(createError("Missing required fields", 400));
        }
    
        const pool = await prisma.pool.findFirst({
            where: {
                propertyId,
                companyId,
            },
            include: {
                property: true,
            },
        });

        if (!pool) {
            return next(createError("Pool not found", 404));
        }

        return res.status(200).json(pool);

    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch pool", 500, error.message));
    }

};

export const updatePool = async (req, res, next) => {

    try {
        const { poolId } = req.params;
        const { type, size, notes } = req.body;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!poolId) {
            return next(createError("Missing required fields", 400));
        }
    
        const result = await prisma.pool.updateMany({
            where: {
                id: poolId,
                companyId,
            },
            data: {
                type,
                size,
                notes,
            },
        });

        if (result.count === 0) {
            return next(createError("Pool not found", 404));
        }

        return res.status(200).json({ message: "Pool updated successfully" });

    } catch (error) {
        console.error(error);
        return next(createError("Failed to update pool", 500, error.message));
    }
};

export const deletePool = async (req, res, next) => {

    try {
        const { poolId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!poolId) {
            return next(createError("Missing required fields", 400));
        }

        const result = await prisma.pool.deleteMany({
            where: {
                id: poolId,
                companyId,
            },
        });

        if (result.count === 0) {
            return next(createError("Pool not found", 404));
        }

        return res.status(200).json({ message: "Pool deleted successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to delete pool", 500, error.message));
    }

};