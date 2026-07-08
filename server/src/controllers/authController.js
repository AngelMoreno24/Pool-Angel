import prisma from "../lib/prisma.js";

export const syncUser = async (req, res) => {
  try {
    const supabaseUser = req.user;
console.log("SUPABASE USER:", req.user);
    let user = await prisma.user.findUnique({
      where: {
        authId: supabaseUser.id,
      },
    });

    // Create Prisma user if missing
    if (!user) {
      user = await prisma.user.create({
        data: {
          authId: supabaseUser.id,
          email: supabaseUser.email,
          role: "OWNER",
        },
      });
    }

    // Find existing company
    let company = await prisma.company.findUnique({
      where: {
        ownerId: user.id,
      },
    });


    // Create company if missing
    if (!company) {
      company = await prisma.company.create({
        data: {
          ownerId: user.id,
          name: "My Company",
        },
      });
    }


    // Always make sure user has companyId
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

    return res.status(500).json({
      message: "Failed to sync user",
    });
  }
};