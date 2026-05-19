import type { Context } from "@netlify/functions";
import { db } from "../../db/index.js";
import { formSubmissions } from "../../db/schema.js";

interface FormPayload {
  form_name: string;
  data: Record<string, string>;
  created_at: string;
}

export default async (req: Request, _context: Context) => {
  const { payload } = (await req.json()) as { payload: FormPayload };

  const data = payload.data ?? {};

  const name =
    data.name || data.fullName || data.contact || null;
  const email = data.email || null;
  const phone = data.phone || null;
  const company = data.company || null;
  const message =
    data.message || data.notes || data.freightDetails || null;

  await db.insert(formSubmissions).values({
    formName: payload.form_name,
    name,
    email,
    phone,
    company,
    message,
    formData: data,
    isSpam: false,
    createdAt: new Date(payload.created_at),
  });

  return new Response("OK");
};
