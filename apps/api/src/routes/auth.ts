import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ENV } from "../env.js";
import { prisma } from "../db/prisma.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["dispatcher", "driver", "admin"]).default("dispatcher"),
  tenantName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({ data: { name: body.tenantName.trim() } });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: body.email,
          passwordHash,
          role: body.role,
        },
        select: { id: true, tenantId: true, email: true, role: true },
      });
      return user;
    });

    res.status(201).json({ ok: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, tenantId: true, email: true, role: true, passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, tenant_id: user.tenantId, role: user.role, email: user.email },
      ENV.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({ ok: true, token });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing or invalid authorization header" });
      return;
    }

    const oldToken = authHeader.slice(7);
    const payload = jwt.verify(oldToken, ENV.JWT_SECRET) as jwt.JwtPayload;

    const token = jwt.sign(
      { id: payload.id, tenant_id: payload.tenant_id, role: payload.role, email: payload.email },
      ENV.JWT_SECRET,
      { expiresIn: "8h" },
    );

    res.json({ ok: true, token });
  } catch (err) {
    next(err);
  }
});

export default router;
