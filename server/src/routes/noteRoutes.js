import express from "express";
import { createNote, deleteNote, getNote, getNotes, updateNote } from "../controllers/noteContoller.js";
import requireAuth from "../middleware/requireAuth.js";
import { validate } from "../middleware/validateSchema.js";
import { noteSchema, noteUpdateSchema } from "../schema/noteSchema.js";

const router = express.Router();

router.post("/create", requireAuth, validate(noteSchema), createNote);
router.get("/getAll", requireAuth, getNotes);
router.get("/:noteId", requireAuth, getNote);
router.put("/update/:noteId", requireAuth, validate(noteUpdateSchema), updateNote);
router.delete("/delete/:noteId", requireAuth, deleteNote);

export default router;