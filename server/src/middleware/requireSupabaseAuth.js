import supabase from "../lib/supabase.js";

const requireSupabaseAuth = async (req, res, next) => {
  try {
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

    req.user = data.user;

    next();

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Authentication failed",
    });
  }
};

export default requireSupabaseAuth;