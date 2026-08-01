import prisma from "../lib/prisma.js";

export const createCustomer = async (req, res) => {

    console.log("called createCustomer controller")
    try {

        const { firstName, lastName, email, phone } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            console.log("User is not authorized to create customer");
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!firstName) {
            console.log("Missing required fields for createCustomer:", { firstName, lastName, email, phone });
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        const customer = await prisma.customer.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            companyId
        },
        });
        console.log("Created customer:", customer);

        return res.status(201).json(customer);
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}

export const getCustomers = async (req, res) => {

    try {
        console.log("getCustomers controller called");

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        const customers = await prisma.customer.findMany({
            where: 
                { companyId: companyId
            },
        });
        return res.status(200).json(customers);
    }catch (error) { 
        console.error(error);
        console.log("Error in getCustomers:", error);
        return res.status(500).json({ error: "Internal server error" });
    }

}


export const getCustomer = async (req, res) => {

    try {

        const { customerId } = req.params;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!customerId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        const customer = await prisma.customer.findUnique({
            where: 
                { 
                    id: customerId
                },
        });

        return res.status(200).json(customer);
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}


export const updateCustomer = async (req, res) => {

    try {

        const { customerId } = req.params;

        const { firstName, lastName, email, phone } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!customerId) {
            return res.status(400).json({ error: "Missing required fields" });
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
            return res.status(404).json({
                error: "Customer not found",
            });
        }


        return res.status(200).json({  message: "Customer updated successfully" });
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}



export const deleteCustomer = async (req, res) => {

    try {

        const { customerId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!customerId) {
            return res.status(400).json({ error: "Missing required fields" });
        }


        const result = await prisma.customer.deleteMany({
            where: {
                id: customerId,
                companyId,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                error: "Customer not found",
            });
        }


        return res.status(200).json({  message: "Customer deleted successfully" });
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}