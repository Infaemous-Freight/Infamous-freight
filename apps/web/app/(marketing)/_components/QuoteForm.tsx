"use client";

import { type FormEvent, useState } from "react";

type QuoteFormState = {
  company: string;
  contact: string;
  email: string;
  origin: string;
  destination: string;
  details: string;
};

const initialState: QuoteFormState = {
  company: "",
  contact: "",
  email: "",
  origin: "",
  destination: "",
  details: "",
};

export default function QuoteForm() {
  const [quoteForm, setQuoteForm] = useState<QuoteFormState>(initialState);

  const handleQuoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = [
      `Company: ${quoteForm.company || "N/A"}`,
      `Contact: ${quoteForm.contact || "N/A"}`,
      `Email: ${quoteForm.email || "N/A"}`,
      `Origin: ${quoteForm.origin || "N/A"}`,
      `Destination: ${quoteForm.destination || "N/A"}`,
      "",
      "Freight details:",
      quoteForm.details || "N/A",
    ].join("\n");

    const query = new URLSearchParams({
      subject: `Freight quote request from ${quoteForm.company || "Website lead"}`,
      body,
    });

    window.location.href = `mailto:quotes@infamousfreight.com?${query.toString()}`;
  };

  return (
    <div className="rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-8">
      <form onSubmit={handleQuoteSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["company", "Company name"],
            ["contact", "Contact name"],
            ["email", "Email"],
            ["origin", "Origin city / state"],
          ].map(([field, placeholder]) => {
            const type = field === "email" ? "email" : "text";
            const autoComplete =
              field === "company"
                ? "organization"
                : field === "contact"
                  ? "name"
                  : field === "email"
                    ? "email"
                    : field === "origin"
                      ? "address-level2"
                      : "off";

            return (
              <input
                key={field}
                name={field}
                type={type}
                required
                autoComplete={autoComplete}
                aria-label={placeholder}
                placeholder={placeholder}
                className="h-12 rounded-2xl border border-slate-300 px-4"
                value={quoteForm[field as keyof QuoteFormState]}
                onChange={(e) =>
                  setQuoteForm((prev) => ({ ...prev, [field]: e.target.value }))
                }
              />
            );
          })}
          <input
            name="destination"
            type="text"
            required
            autoComplete="address-level2"
            aria-label="Destination city / state"
            placeholder="Destination city / state"
            className="h-12 rounded-2xl border border-slate-300 px-4 md:col-span-2"
            value={quoteForm.destination}
            onChange={(e) => setQuoteForm((prev) => ({ ...prev, destination: e.target.value }))}
          />
          <textarea
            name="details"
            required
            aria-label="Freight details, weight, equipment type, pickup date, or any special handling notes"
            placeholder="Freight details, weight, equipment type, pickup date, or any special handling notes"
            className="min-h-[140px] rounded-2xl border border-slate-300 p-4 md:col-span-2"
            value={quoteForm.details}
            onChange={(e) => setQuoteForm((prev) => ({ ...prev, details: e.target.value }))}
          />
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">Typical quote response target: under 15 minutes for core lanes.</p>
          <button type="submit" className="rounded-2xl bg-slate-900 px-6 py-3 text-white">
            Request Quote
          </button>
        </div>
      </form>
    </div>
  );
}
