import supabase from "../lib/supabase.js";

const requireAuth = async (req, res, next) => {
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
    console.error("Error verifying token:", error);
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  req.user = data.user;

  next();
};

export default requireAuth;