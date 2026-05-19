CREATE TABLE "form_submissions" (
	"id" serial PRIMARY KEY,
	"form_name" text NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"company" text,
	"message" text,
	"form_data" jsonb NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
