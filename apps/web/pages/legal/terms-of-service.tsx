import Head from "next/head";

export default function TermsOfService(): React.ReactElement {
  return (
    <>
      <Head>
        <title>Terms of Service - Infamous Freight</title>
        <meta name="description" content="Terms of Service for Infamous Freight Enterprises" />
      </Head>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", lineHeight: 1.6 }}>
        <h1>Terms of Service</h1>
        <p>
          <strong>Last Updated: February 16, 2026</strong>
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using Infamous Freight Enterprises ("Company", "we", "us", or "our"), you
          accept and agree to be bound by and comply with these Terms of Service. If you do not
          agree to abide by the above, please do not use this service.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of the materials (information or
          software) on Infamous Freight Enterprises for personal, non-commercial transitory viewing
          only. This is the grant of a license, not a transfer of title, and under this license you
          may not:
        </p>
        <ul>
          <li>modify or copy the materials</li>
          <li>use the materials for any commercial purpose or for any public display</li>
          <li>attempt to decompile or reverse engineer any software contained on the site</li>
          <li>remove any copyright or other proprietary notations from the materials</li>
          <li>transfer the materials to another person or "mirror" the materials on any server</li>
        </ul>

        <h2>3. Disclaimer</h2>
        <p>
          The materials on Infamous Freight Enterprises are provided on an 'as is' basis. We make no
          warranties, expressed or implied, and hereby disclaim and negate all other warranties
          including, without limitation, implied warranties or conditions of merchantability,
          fitness for a particular purpose, or non-infringement of intellectual property or other
          violation of rights.
        </p>

        <h2>4. Limitations</h2>
        <p>
          In no event shall Infamous Freight Enterprises or its suppliers be liable for any damages
          (including, without limitation, damages for loss of data or profit, or due to business
          interruption) arising out of the use or inability to use the materials on Infamous Freight
          Enterprises.
        </p>

        <h2>5. Accuracy of Materials</h2>
        <p>
          The materials appearing on Infamous Freight Enterprises could include technical,
          typographical, or photographic errors. We do not warrant that any of the materials on
          Infamous Freight Enterprises are accurate, complete, or current. We may make changes to
          the materials contained on Infamous Freight Enterprises at any time without notice.
        </p>

        <h2>6. Links</h2>
        <p>
          We have not reviewed all of the sites linked to our website and are not responsible for
          the contents of any such linked site. The inclusion of any link does not imply endorsement
          by us of the site. Use of any such linked website is at the user's own risk.
        </p>

        <h2>7. Modifications</h2>
        <p>
          We may revise these terms of service for Infamous Freight Enterprises at any time without
          notice. By using this website, you are agreeing to be bound by the then current version of
          these terms of service.
        </p>

        <h2>8. Contact Information</h2>
        <p>
          If you have any questions about these Terms of Service, please contact us at:
          <br />
          <strong>Infamous Freight Enterprises</strong>
          <br />
          Email: legal@infamousfreight.com
          <br />
          Address: [Your Company Address]
        </p>
      </div>
    </>
  );
}
