import Head from "next/head";

export default function PrivacyPolicy(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Privacy Policy - Infæmous Freight</title>
        <meta name="description" content="Privacy Policy for Infæmous Freight Enterprises" />
      </Head>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
        <h1>Privacy Policy</h1>
        <p>
          <strong>Last Updated: February 16, 2026</strong>
        </p>

        <h2>1. Introduction</h2>
        <p>
          Infæmous Freight Enterprises ("we", "us", "our") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you visit our website and use our services.
        </p>

        <h2>2. Information We Collect</h2>
        <p>
          <strong>Personal Information:</strong>
        </p>
        <ul>
          <li>Name, email address, phone number</li>
          <li>Shipping address and billing address</li>
          <li>Payment information (credit card, PayPal account)</li>
          <li>Driver's license number (for drivers)</li>
          <li>Business information (for corporate accounts)</li>
        </ul>

        <p>
          <strong>Automatically Collected Information:</strong>
        </p>
        <ul>
          <li>IP address, browser type, operating system</li>
          <li>Pages visited, time spent on pages</li>
          <li>Cookies and similar tracking technologies</li>
          <li>Location data (if permitted)</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <ul>
          <li>To provide and improve our services</li>
          <li>To process transactions and send related information</li>
          <li>To send marketing and promotional communications (with consent)</li>
          <li>To comply with legal obligations</li>
          <li>To prevent fraud and enhance security</li>
          <li>To respond to customer support requests</li>
        </ul>

        <h2>4. Data Protection</h2>
        <p>
          We use industry-standard security measures to protect your personal information,
          including:
        </p>
        <ul>
          <li>SSL/TLS encryption for data in transit</li>
          <li>AES-256 encryption for sensitive data at rest</li>
          <li>Regular security audits and penetration testing</li>
          <li>Access controls and authentication measures</li>
          <li>Encrypted backups stored securely</li>
        </ul>

        <h2>5. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar technologies to enhance your experience. You can control cookie
          settings in your browser. Some essential cookies may not be disable able.
        </p>

        <h2>6. Third-Party Services</h2>
        <p>We share information with trusted third parties for:</p>
        <ul>
          <li>Payment processing (Stripe, PayPal)</li>
          <li>Analytics (Google Analytics)</li>
          <li>Email delivery (SendGrid)</li>
          <li>Cloud hosting (AWS)</li>
        </ul>
        <p>
          These providers have their own privacy policies and are contractually obligated to protect
          your data.
        </p>

        <h2>7. Your Rights</h2>
        <p>Under GDPR and other privacy laws, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion (Right to be Forgotten)</li>
          <li>Restrict processing</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>

        <h2>8. Data Retention</h2>
        <p>
          We retain your personal data for as long as necessary to provide our services and comply
          with legal obligations. Audit logs are retained for 12 months for legal compliance.
        </p>

        <h2>9. Children's Privacy</h2>
        <p>
          Our services are not directed to children under 13. We do not knowingly collect
          information from children under 13. If we become aware of such collection, we will
          promptly delete that information.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of significant changes
          via email or prominent notice on our website. Your continued use constitutes acceptance of
          the updated policy.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          For privacy-related questions or to exercise your rights:
          <br />
          <strong>Privacy Officer</strong>
          <br />
          Email: privacy@infamousfreight.com
          <br />
          Address: [Your Company Address]
        </p>
      </div>
    </>
  );
}
