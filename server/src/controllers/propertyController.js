import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

export const createProperty = async (req, res, next) => {

    try {

        const { customerId, address, city, state, zip } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!customerId || !companyId || !address) {
            return next(createError("Missing required fields", 400));
        }
        
        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                companyId,
            },
        });

        if (!customer) {
            return next(createError("Customer not found", 404));
        }

        const property = await prisma.property.create({
            data: {
                customerId,
                companyId,
                address,
                city,
                state,
                zip,
            },
        });

        return res.status(201).json(property);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to create property", 500, error.message));
    }

};

export const getProperties = async (req, res, next) => {

    try {
        const { customerId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!customerId) {
            return next(createError("Missing required fields", 400));
        }
    
        const properties = await prisma.property.findMany({
            where: {
                companyId,
                customerId,
            },
        });

        return res.status(200).json(properties);

    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch properties", 500, error.message));
    }
};

export const getProperty = async (req, res, next) => {

    try {
        const { propertyId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!propertyId) {
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

        return res.status(200).json(property);

    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch property", 500, error.message));
    }
};

export const updateProperty = async (req, res, next) => {

    try {
        const { propertyId } = req.params;
        const { address, city, state, zip } = req.body;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!propertyId) {
            return next(createError("Missing required fields", 400));
        }
    
        const result = await prisma.property.updateMany({
            where: {
                id: propertyId,
                companyId,
            },
            data: {
                address,
                city,
                state,
                zip,
            },
        });

        if (result.count === 0) {
            return next(createError("Property not found", 404));
        }

        return res.status(200).json({ message: "Property updated successfully" });

    } catch (error) {
        console.error(error);
        return next(createError("Failed to update property", 500, error.message));
    }
};

export const deleteProperty = async (req, res, next) => {

    try {
        const { propertyId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }

        if (!propertyId) {
            return next(createError("Missing required fields", 400));
        }

        const result = await prisma.property.deleteMany({
            where: {
                id: propertyId,
                companyId,
            },
        });

        if (result.count === 0) {
            return next(createError("Property not found", 404));
        }

        return res.status(200).json({ message: "Property deleted successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to delete property", 500, error.message));
    }

};