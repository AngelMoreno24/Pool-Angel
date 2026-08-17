import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import poolRoutes from "./routes/poolRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import techRoutes from "./routes/authRoutes.js"
import jobRoutes from "./routes/jobRoutes.js"
import visitRoutes from "./routes/visitRoutes.js"

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API Running",
  });
});

app.use("/auth", authRoutes);
app.use("/customers", customerRoutes);
app.use("/properties", propertyRoutes);
app.use("/pools", poolRoutes);
app.use("/techs", techRoutes);
app.use("/jobs", jobRoutes);
app.use("/visits", visitRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});