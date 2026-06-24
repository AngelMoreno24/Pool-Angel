import prisma from "../lib/prisma.js";

export const syncUser = async (req, res) => {
  console.log("Syncing user with Supabase auth ID:");
  console.log("Syncing user with Supabase auth ID:", req.user.id);
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

    res.status(200).json(user);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to sync user",
    });
  }
};