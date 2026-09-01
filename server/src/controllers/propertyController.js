import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import { geocodeAddress } from "../lib/geocode.js";
 
 
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
 
        // FIX: geocodeAddress returns null on failure (bad address, Nominatim
        // down, rate-limited) - the original code did coords.latitude
        // unconditionally, which crashed property creation entirely on any
        // geocoding failure. Now it degrades gracefully: the property still
        // gets created, just without coordinates (won't appear on the route
        // map until re-geocoded).
        const coords = await geocodeAddress(address, city, state, zip);
 
        const property = await prisma.property.create({
            data: {
                customerId,
                companyId,
                address,
                city,
                state,
                zip,
                latitude: coords?.latitude ?? null,
                longitude: coords?.longitude ?? null,
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
 
        if (!companyId ) {
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
 
        if (!companyId ) {
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
 
        // FIX: address edits never re-geocoded before - the stored lat/lng
        // would silently keep pointing at the OLD address forever, showing
        // the property in the wrong place on the map with no indication
        // anything was stale. Only re-geocode when an address-related field
        // actually changed, to avoid burning a geocoding call on every
        // unrelated edit.
        const addressChanged = address !== undefined || city !== undefined || state !== undefined || zip !== undefined;
        let coords = null;
 
        if (addressChanged) {
            const existing = await prisma.property.findFirst({
                where: { id: propertyId, companyId },
            });
 
            if (!existing) {
                return next(createError("Property not found", 404));
            }
 
            coords = await geocodeAddress(
                address ?? existing.address,
                city ?? existing.city,
                state ?? existing.state,
                zip ?? existing.zip,
            );
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
                // Only overwrite coordinates if this update actually touched
                // the address and geocoding succeeded - a failed geocode on
                // an edit shouldn't wipe out previously-good coordinates.
                ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
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
