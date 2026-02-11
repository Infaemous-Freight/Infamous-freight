import express from "express";

export default (prisma) => {
  const router = express.Router();

  const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

  router.post(
    "/",
    asyncHandler(async (req, res, next) => {
      const load = await prisma.load.create({ data: req.body });
      res.json(load);
    }),
  );

  router.get(
    "/",
    asyncHandler(async (req, res, next) => {
      const loads = await prisma.load.findMany();
      res.json(loads);
    }),
  );
  return router;
};
