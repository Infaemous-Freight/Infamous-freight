import type { NextApiRequest, NextApiResponse } from "next";

type LoiRecord = {
  fullName?: string;
  phone?: string;
  email?: string;
  state?: string;
  businessName?: string;
  mcDot?: string;
  trucks?: number;
  weeklyLoads?: number;
  betaInterest?: string;
  nonBindingAck?: string;
  signature?: string;
  source?: string;
  createdAt?: string;
};

type LoiRequestBody = {
  record?: LoiRecord;
} & LoiRecord;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const airtableToken = process.env.AIRTABLE_TOKEN;
  const airtableBaseId = process.env.AIRTABLE_BASE_ID;
  const airtableTableId = process.env.AIRTABLE_TABLE_ID;

  if (!airtableToken || !airtableBaseId || !airtableTableId) {
    return res.status(500).json({
      error: "Missing Airtable configuration.",
    });
  }

  const body = req.body as LoiRequestBody;
  const record = body.record ?? body;

  try {
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${airtableToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [
            {
              fields: {
                Name: record.fullName,
                Phone: record.phone,
                Email: record.email,
                State: record.state,
                BusinessName: record.businessName,
                MCDOT: record.mcDot,
                Trucks: record.trucks,
                WeeklyLoads: record.weeklyLoads,
                BetaInterest: record.betaInterest,
                NonBindingAck: record.nonBindingAck,
                Signature: record.signature,
                Source: record.source,
                CreatedAt: record.createdAt,
                Status: "New",
              },
            },
          ],
        }),
      },
    );

    const responseBody = await airtableResponse.json();

    if (!airtableResponse.ok) {
      return res.status(airtableResponse.status).json({
        error: "Airtable request failed.",
        details: responseBody,
      });
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    return res.status(500).json({
      error: "Unexpected error while sending Airtable request.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
