import { Analytics } from "../components/Analytics";
import { DriverGamification } from "../components/DriverGamification";
import { DynamicPricing } from "../components/DynamicPricing";
import { LoadAuction } from "../components/LoadAuction";
import { StripeCustomerPortal } from "../components/StripeCustomerPortal";
import { SupportWidget } from "../components/SupportWidget";
import { VoiceLoadBooking } from "../components/VoiceLoadBooking";

const faq = [
  {
    question: "How do I post a load?",
    answer: "Go to Load Board > Create Load, then publish to your selected carriers or marketplace.",
  },
  {
    question: "How does billing work?",
    answer: "Subscriptions are managed in Stripe with trial support and customer self-service portal.",
  },
  {
    question: "How can I contact support?",
    answer: "Use the live chat widget or email support@infamousfreight.com.",
  },
];

export default function HelpPage() {
  return (
    <main style={{ display: "grid", gap: 12, padding: 16 }}>
      <h1 style={{ marginBottom: 0 }}>Help Center</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>FAQ, support channels, and product walkthrough widgets.</p>

      <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>FAQ</h2>
        <ul style={{ marginBottom: 0 }}>
          {faq.map((item) => (
            <li key={item.question}>
              <strong>{item.question}</strong>
              <p>{item.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      <VoiceLoadBooking />
      <DynamicPricing />
      <DriverGamification />
      <LoadAuction />
      <StripeCustomerPortal />
      <Analytics />
      <SupportWidget />
    </main>
  );
}
