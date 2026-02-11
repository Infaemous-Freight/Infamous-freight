import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";

export default (prisma) => {
  const router = express.Router();

  router.post("/register", async (req, res) => {
  router.post("/register", async (req, res, next) => {
    try {
      const { email, password, role } = req.body;
      const hash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { email, password: hash, role }
      });

      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await bcrypt.compare(password, user.password)))
        return res.status(401).send("Invalid credentials");

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET
      );

      res.json({ token });
    } catch (err) {
      next(err);
    }
  });

  return router;
};
