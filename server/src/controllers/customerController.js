import prisma from "../lib/prisma.js";

export const createCustomer = async (req, res) => {

    try {

        const { firstName, lastName, email, phone } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!firstName) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            phone
        },
        });

        return res.status(201).json(user);
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}

export const getCustomers = async (req, res) => {

    try {


        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!firstName) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        const user = await prisma.user.findMany({
            where: 
                { companyId: companyId
            },
        });

        return res.status(201).json(user);
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}