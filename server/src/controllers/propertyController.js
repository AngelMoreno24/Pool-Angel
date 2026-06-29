import prisma from "../lib/prisma.js";

export const createProperty = async (req, res) => {

    try {

        const { customerId, address, city, state, zip } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!customerId || !companyId || !address) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        
        const customer = await prisma.customer.findFirst({
            where: {
                id: customerId,
                companyId,
            },
        });

        if (!customer) {
            return res.status(404).json({
                error: "Customer not found",
            });
        }

        const property = await prisma.property.create({
        data: {
            customerId,
            companyId,
            address,
            city,
            state,
            zip
        },
        });

        return res.status(201).json(property);
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}

export const getProperties = async (req, res) => {

    try {


        const { customerId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!customerId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        const properties = await prisma.property.findMany({
            where: 
                { 
                    companyId: companyId,
                    customerId: customerId
            },
        });

        return res.status(200).json(properties);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}

export const getProperty = async (req, res) => {

    try {


        const { propertyId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!propertyId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        const property = await prisma.property.findFirst({
            where: 
                { 
                    id: propertyId,
                    companyId: companyId,
            },
        });

        if (!property) {
            return res.status(404).json({
                error: "Property not found",
            });
        }

        return res.status(200).json(property);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


export const updateProperty = async (req, res) => {

    try {

        const { propertyId } = req.params;

        const { address, city, state, zip } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!propertyId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        
        const result = await prisma.property.updateMany({
            where: {
                id: propertyId,
                companyId: companyId,
            },
            data: {
                address,
                city,
                state,
                zip
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                error: "Property not found",
            });
        }

        return res.status(200).json({  message: "Property updated successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}



export const deleteProperty = async (req, res) => {

    try {

        const { propertyId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!propertyId) {
            return res.status(400).json({ error: "Missing required fields" });
        }


        const result = await prisma.property.deleteMany({
            where: {
                id: propertyId,
                companyId: companyId,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                error: "Property not found",
            });
        }


        return res.status(200).json({  message: "Property deleted successfully" });
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}