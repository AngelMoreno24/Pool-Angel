import prisma from "../lib/prisma.js";
import { adminSupabase } from "../lib/supabase.js";
import { createError } from "../middleware/errorHandler.js";

export const createTech = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body || {};

    if (!email || !password) {
      return next(createError("Email and password are required", 400));
    }

    if (!req.user?.companyId) {
      return next(createError("You must belong to a company before creating a tech account", 400));
    }

    if (req.user?.role !== "OWNER") {
      return next(createError("Only owners can create tech accounts", 403));
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return next(createError("A user with that email already exists", 409));
    }

    if (!adminSupabase) {
      return next(createError("Supabase service role key is not configured", 500));
    }

    const { data: createdAuthUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        lastName,
        role: "TECH",
      },
      app_metadata: {
        role: "TECH",
      },
    });

    if (authError || !createdAuthUser?.user) {
      return next(createError("Failed to create Supabase user", 500, authError?.message));
    }

    let createdDbUser;

    try {
      createdDbUser = await prisma.user.create({
        data: {
          authId: createdAuthUser.user.id,
          email: createdAuthUser.user.email || email,
          firstName,
          lastName,
          role: "TECH",
          companyId: req.user.companyId,
        },
      });
    } catch (dbError) {
      await adminSupabase.auth.admin.deleteUser(createdAuthUser.user.id);
      throw dbError;
    }

    return res.status(201).json({
      message: "Tech account created successfully",
      user: createdDbUser,
      supabaseUser: createdAuthUser.user,
    });
  } catch (error) {
    console.error("Create tech account error:", error);
    return next(createError("Failed to create tech account", 500, error.message));
  }
};


export const getTechs = async (req, res, next) => {
 
    try {
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        const technicians = await prisma.user.findMany({
            where: { companyId, role: "TECH" },
        });
        return res.status(200).json(technicians);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch technicians", 500, error.message));
    }
 
};
 
 
export const getTech = async (req, res, next) => {
 
    try {
 
        const { technicianId } = req.params;
 
        const { companyId, role } = req.user;
 
        if (!companyId || role !== "OWNER") {
            return next(createError("Forbidden", 403));
        }
 
        if (!technicianId) {
            return next(createError("Missing required fields", 400));
        }
    
        const technician = await prisma.user.findUnique({
            where: { id: technicianId },
        });

        if (!technician) {
            return next(createError("Technician not found", 404));
        }

        return res.status(200).json(technician);
    } catch (error) {
        console.error(error);
        return next(createError("Failed to fetch technician", 500, error.message));
    }
 
};
 