import prisma from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

export const syncUser = async (req, res, next) => {
  try {
    const supabaseUser = req.user;
    let user = await prisma.user.findUnique({
      where: {
        authId: supabaseUser.id,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          authId: supabaseUser.id,
          email: supabaseUser.email,
          role: "OWNER",
        },
      });
    }

    let company = await prisma.company.findUnique({
      where: {
        ownerId: user.id,
      },
    });

    if (!company) {
      company = await prisma.company.create({
        data: {
          ownerId: user.id,
          name: "My Company",
        },
      });
    }

    if (user.companyId !== company.id) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          companyId: company.id,
        },
      });
    }

    return res.status(200).json({
      user,
      company,
    });

  } catch (error) {
    console.error("Sync error:", error);
    return next(createError("Failed to sync user", 500, error.message));
  }
};