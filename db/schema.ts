import { pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const formSubmissions = pgTable("form_submissions", {
  id: serial().primaryKey(),
  formName: text("form_name").notNull(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  message: text("message"),
  formData: jsonb("form_data").notNull(),
  isSpam: boolean("is_spam").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
