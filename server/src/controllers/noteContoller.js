import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

const attachmentFields = ["customerId", "propertyId", "visitId"];

const canManageNotes = (req, next) => {
    if (!req.user.companyId || req.user.role !== "OWNER") {
        next(createError("Forbidden", 403));
        return false;
    }
    return true;
};

const findCompanyAttachment = async (companyId, field, id) => {
    const model = {
        customerId: prisma.customer,
        propertyId: prisma.property,
        visitId: prisma.visit,
    }[field];

    return model.findFirst({ where: { id, companyId }, select: { id: true } });
};

const noteInclude = {
    author: { select: { id: true, firstName: true, lastName: true } },
};

export const createNote = async (req, res, next) => {
    try {
        const { body, ownerOnly = false, pinned = false, customerId, propertyId, visitId } = req.body;
        const { companyId, role, dbUserId } = req.user;

        if (!companyId || role !== "OWNER") return next(createError("Forbidden", 403));

        const attachments = attachmentFields.filter((field) => req.body[field]);
        if (attachments.length !== 1) {
            return next(createError("A note must be attached to exactly one customer, property, or visit", 400));
        }

        const attachmentField = attachments[0];
        const attachmentId = { customerId, propertyId, visitId }[attachmentField];
        if (!(await findCompanyAttachment(companyId, attachmentField, attachmentId))) {
            return next(createError("Attached record not found", 404));
        }

        const note = await prisma.note.create({
            data: {
                companyId,
                authorId: dbUserId,
                body,
                ownerOnly,
                pinned,
                [attachmentField]: attachmentId,
            },
        });
        return res.status(201).json(note);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to create note", 500, error.message));
    }
};

export const getNotes = async (req, res, next) => {
    try {
        const { companyId, role } = req.user;
        if (!companyId) return next(createError("Forbidden", 403));

        const notes = await prisma.note.findMany({
            where: { companyId, ...(role === "TECH" ? { ownerOnly: false } : {}) },
            include: noteInclude,
            orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        });
        return res.status(200).json(notes);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch notes", 500, error.message));
    }
};

export const getNote = async (req, res, next) => {
    try {
        const { companyId, role } = req.user;
        if (!companyId) return next(createError("Forbidden", 403));

        const note = await prisma.note.findFirst({
            where: {
                id: req.params.noteId,
                companyId,
                ...(role === "TECH" ? { ownerOnly: false } : {}),
            },
            include: noteInclude,
        });
        if (!note) return next(createError("Note not found", 404));
        return res.status(200).json(note);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch note", 500, error.message));
    }
};

export const updateNote = async (req, res, next) => {
    try {
        if (!canManageNotes(req, next)) return;

        const { noteId } = req.params;
        const { companyId } = req.user;
        const { body, ownerOnly, pinned } = req.body;
        const result = await prisma.note.updateMany({
            where: { id: noteId, companyId },
            data: {
                ...(body !== undefined ? { body } : {}),
                ...(ownerOnly !== undefined ? { ownerOnly } : {}),
                ...(pinned !== undefined ? { pinned } : {}),
            },
        });
        if (result.count === 0) return next(createError("Note not found", 404));

        const note = await prisma.note.findFirst({ where: { id: noteId, companyId }, include: noteInclude });
        return res.status(200).json(note);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to update note", 500, error.message));
    }
};

export const deleteNote = async (req, res, next) => {
    try {
        if (!canManageNotes(req, next)) return;

        const result = await prisma.note.deleteMany({
            where: { id: req.params.noteId, companyId: req.user.companyId },
        });
        if (result.count === 0) return next(createError("Note not found", 404));
        return res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error(error);
        return next(createError("Failed to delete note", 500, error.message));
    }
};