import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
 
export const createCustomer = async (req, res, next) => {
 
    try {
 
        const { firstName, lastName, email, phone } = req.body;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        const customer = await prisma.customer.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                companyId,
            },
        });
 
        return res.status(201).json(customer);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to create customer", 500, error.message));
    }
 
};
 
export const getCustomers = async (req, res, next) => {
 
    try {
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        const customers = await prisma.customer.findMany({
            where: { companyId },
        });
        return res.status(200).json(customers);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch customers", 500, error.message));
    }
 
};
 
 
export const getCustomer = async (req, res, next) => {
 
    try {
 
        const { customerId } = req.params;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!customerId) {
            return next(createError("Missing required fields", 400));
        }
    
        const customer = await prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) {
            return next(createError("Customer not found", 404));
        }
 
        return res.status(200).json(customer);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch customer", 500, error.message));
    }
 
};
 
 
export const updateCustomer = async (req, res, next) => {
 
    try {
 
        const { customerId } = req.params;
 
        const { firstName, lastName, email, phone } = req.body;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!customerId) {
            return next(createError("Missing required fields", 400));
        }
 
        const result = await prisma.customer.updateMany({
            where: {
                id: customerId,
                companyId,
            },
            data: {
                firstName,
                lastName,
                email,
                phone,
            },
        });
 
        if (result.count === 0) {
            return next(createError("Customer not found", 404));
        }
 
        return res.status(200).json({ message: "Customer updated successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to update customer", 500, error.message));
    }
 
};
 
 
export const deleteCustomer = async (req, res, next) => {
 
    try {
 
        const { customerId } = req.params;
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!customerId) {
            return next(createError("Missing required fields", 400));
        }
 
        const result = await prisma.customer.deleteMany({
            where: {
                id: customerId,
                companyId,
            },
        });
 
        if (result.count === 0) {
            return next(createError("Customer not found", 404));
        }
 
        return res.status(200).json({ message: "Customer deleted successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to delete customer", 500, error.message));
    }
 
};
