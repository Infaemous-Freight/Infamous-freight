import { Request, Response } from "express";
import prisma from "../db";

export async function createDispute(req: Request, res: Response) {
  const { userId, transactionId, processor } = req.body;

  const dispute = await prisma.dispute.create({
    data: { userId, transactionId, processor, status: "OPEN" },
  });

  res.json(dispute);
}
