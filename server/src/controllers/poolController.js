import prisma from "../lib/prisma.js";

export const createPool = async (req, res) => {

    try {

        const { propertyId, type, size, notes } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!propertyId || !companyId) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        //check if property exists
        const property = await prisma.property.findFirst({
            where: {
                id: propertyId,
                companyId,
            },
        });

        if (!property) {
            return res.status(404).json({
                error: "Property not found",
            });
        }

        //check if a pool already exists
        const existingPool = await prisma.pool.findFirst({
            where: {
                propertyId,
            },
        });

        if (existingPool) {
            return res.status(409).json({
                error: "This property already has a pool.",
            });
        }

        const pool = await prisma.pool.create({
        data: {
            propertyId,
            companyId,
            type,
            size,
            notes
        },
        });

        return res.status(201).json(pool);
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}

export const getPool = async (req, res) => {

    try {


        const { poolId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!poolId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        const pool = await prisma.pool.findFirst({
            where: 
                { 
                    id: poolId,
                    companyId: companyId,
            },
            include: {
                property: true,
            },
        });

        if (!pool) {
            return res.status(404).json({
                error: "Pool not found",
            });
        }

        return res.status(200).json(pool);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}




export const updatePool = async (req, res) => {

    try {

        const { poolId } = req.params;

        const { type, size, notes } = req.body;

        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!poolId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
    
        
        const result = await prisma.pool.updateMany({
            where: {
                id: poolId,
                companyId: companyId,
            },
            data: {
                type,
                size,
                notes
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                error: "Pool not found",
            });
        }

        return res.status(200).json({  message: "Pool updated successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
}



export const deletePool = async (req, res) => {

    try {

        const { poolId } = req.params;
        const { companyId, role } = req.user;

        if (!companyId || role !== "OWNER") {
            return res.status(403).json({ error: "Forbidden" });
        }

        if (!poolId) {
            return res.status(400).json({ error: "Missing required fields" });
        }


        const result = await prisma.pool.deleteMany({
            where: {
                id: poolId,
                companyId: companyId,
            },
        });

        if (result.count === 0) {
            return res.status(404).json({
                error: "Pool not found",
            });
        }


        return res.status(200).json({  message: "Pool deleted successfully" });
    }catch (error) { 
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }

}