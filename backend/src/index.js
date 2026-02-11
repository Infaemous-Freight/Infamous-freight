import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./auth.js";
import loadRoutes from "./loads.js";

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes(prisma));
app.use("/api/loads", loadRoutes(prisma));

app.get("/", (_, res) => res.send("Infamous Freight API running"));

app.listen(5000, () =>
  console.log("Backend running on http://localhost:5000")
);
