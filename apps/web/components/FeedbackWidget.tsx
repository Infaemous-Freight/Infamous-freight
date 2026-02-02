/**
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * User Feedback Widget - Embeddable feedback collection
 */

import { useState } from "react";

interface FeedbackForm {
  category: string;
  title: string;
  description: string;
  rating?: number;
  screenshot_url?: string;
}

const categories = [
  { value: "feature_request", label: "💡 Feature Request" },
  { value: "bug_report", label: "🐛 Bug Report" },
  { value: "performance", label: "⚡ Performance Issue" },
  { value: "ui_ux", label: "🎨 UI/UX Feedback" },
  { value: "general", label: "💬 General Feedback" },
];

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<FeedbackForm>({
    category: "general",
    title: "",
    description: "",
    rating: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
          setForm({
            category: "general",
            title: "",
            description: "",
            rating: undefined,
          });
        }, 2000);
      }
    } catch {
      alert("Failed to submit feedback. Please try again.");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        💬 Feedback
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Send Feedback</h3>
        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
          ✕
        </button>
      </div>

      {/* Form */}
      {submitted ? (
        <div className="p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h4>
          <p className="text-gray-600">Your feedback has been submitted.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Brief summary..."
              maxLength={200}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={4}
              placeholder="Tell us more..."
              maxLength={5000}
              required
            />
            <div className="text-xs text-gray-500 mt-1">{form.description.length}/5000</div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Overall Experience (Optional)
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                  className={`text-3xl transition-transform hover:scale-110 ${
                    form.rating && star <= form.rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium"
          >
            Submit Feedback
          </button>
        </form>
      )}
    </div>
  );
}
