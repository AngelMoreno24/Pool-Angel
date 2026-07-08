import supabase from "../lib/supabase.js";
import prisma from "../lib/prisma.js";

const requireAuth = async (req, res, next) => {
  try {
    console.log("requireAuth middleware called");

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Authorization header missing",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    const supabaseUser = data.user;

    // Get your application user
    const user = await prisma.user.findUnique({
      where: {
        authId: supabaseUser.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found in database",
      });
    }

    console.log("Authenticated useraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:", user);

    // Attach both auth + app data
    req.user = {
      ...supabaseUser,
      dbUserId: user.id,
      companyId: user.companyId,
      role: user.role,
    };

    console.log("Authenticated user:", req.user);

    next();

  } catch (error) {
    console.error("Auth middleware error:", error);

    res.status(500).json({
      message: "Authentication failed",
    });
  }
};



export default requireAuth;