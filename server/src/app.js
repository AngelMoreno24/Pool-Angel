import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import poolRoutes from "./routes/poolRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import jobRoutes from "./routes/jobRoutes.js";
import visitRoutes from "./routes/visitRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.ORIGIN,
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
app.use("/techs", authRoutes);
app.use("/jobs", jobRoutes);
app.use("/visits", visitRoutes);

app.use(errorHandler);

export default app;
