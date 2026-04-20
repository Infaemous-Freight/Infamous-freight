import { Injectable, Logger } from '@nestjs/common';

export interface CarrierPacketData {
  carrierName: string;
  dbaName?: string;
  mcNumber: string;
  dotNumber: string;
  scacCode?: string;
  ein: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax?: string;
  email: string;
  primaryContact: string;
  contactTitle?: string;

  // Insurance
  autoLiabilityCarrier: string;
  autoLiabilityPolicy: string;
  autoLiabilityAmount: number;
  autoLiabilityExpiry: Date;

  cargoInsuranceCarrier: string;
  cargoInsurancePolicy: string;
  cargoInsuranceAmount: number;
  cargoInsuranceExpiry: Date;

  generalLiabilityCarrier?: string;
  generalLiabilityPolicy?: string;
  generalLiabilityAmount?: number;

  workersCompCarrier?: string;
  workersCompPolicy?: string;
  workersCompExpiry?: Date;

  // Safety
  csaPercentile?: number;
  safetyRating?: 'Satisfactory' | 'Conditional' | 'Unsatisfactory';
  oosRate?: number;

  // Equipment
  equipmentTypes: string[];
  numberOfTrucks: number;
  numberOfTrailers: number;

  // References
  tradeReferences?: Array<{
    company: string;
    contact: string;
    phone: string;
  }>;

  // Banking
  bankName?: string;
  bankAccountType?: 'checking' | 'savings';
  achRouting?: string;
  achAccount?: string;
  factoringCompany?: string;

  // Signatures
  signatureName?: string;
  signatureTitle?: string;
  signatureDate?: Date;
}

export interface BrokerRequirement {
  brokerName: string;
  requiredDocs: string[];
  customFields?: Record<string, string>;
}

@Injectable()
export class CarrierPacketService {
  private readonly logger = new Logger(CarrierPacketService.name);

  async generatePacket(data: CarrierPacketData, requirements?: BrokerRequirement): Promise<{ html: string; pdfUrl: string }> {
    const html = this.buildPacketHtml(data, requirements);
    const pdfUrl = `/documents/carrier-packets/${data.mcNumber}_${Date.now()}.pdf`;

    this.logger.log(`Carrier packet generated for ${data.carrierName} (MC: ${data.mcNumber})`);
    return { html, pdfUrl };
  }

  async generateW9(data: CarrierPacketData): Promise<{ html: string; pdfUrl: string }> {
    const html = this.buildW9Html(data);
    return { html, pdfUrl: `/documents/w9/${data.ein}.pdf` };
  }

  async generateCOI(data: CarrierPacketData): Promise<{ html: string; pdfUrl: string }> {
    const html = this.buildCOIHtml(data);
    return { html, pdfUrl: `/documents/coi/${data.mcNumber}.pdf` };
  }

  private buildPacketHtml(data: CarrierPacketData, requirements?: BrokerRequirement): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Carrier Packet - ${data.carrierName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #222; padding: 40px; }
  .header { text-align: center; border-bottom: 3px solid #ff3d00; padding-bottom: 20px; margin-bottom: 20px; }
  .header h1 { font-size: 24px; color: #ff3d00; font-weight: 800; }
  .header p { color: #666; margin-top: 5px; }
  .section { margin-bottom: 15px; page-break-inside: avoid; }
  .section-title { background: #ff3d00; color: white; padding: 6px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; }
  .grid { display: flex; gap: 20px; }
  .grid-col { flex: 1; }
  .field { margin-bottom: 5px; }
  .field-label { font-size: 9px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
  .field-value { font-size: 11px; font-weight: 600; }
  .insurance-box { background: #f8f8f8; border: 1px solid #ddd; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
  .insurance-box h4 { color: #ff3d00; margin-bottom: 8px; font-size: 11px; }
  .signature-row { display: flex; gap: 60px; margin-top: 30px; }
  .signature-line { border-top: 1px solid #333; padding-top: 4px; width: 250px; font-size: 10px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; padding: 6px; font-size: 9px; text-transform: uppercase; color: #666; background: #f0f0f0; }
  td { padding: 6px; font-size: 10px; border-bottom: 1px solid #eee; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .badge-green { background: #e8f5e9; color: #2e7d32; }
  .badge-red { background: #ffebee; color: #c62828; }
</style>
</head>
<body>
  <div class="header">
    <h1>CARRIER PACKET</h1>
    <p>${data.carrierName} ${data.dbaName ? `(${data.dbaName})` : ''} · MC# ${data.mcNumber} · DOT# ${data.dotNumber}</p>
    ${requirements ? `<p style="margin-top:8px;color:#ff3d00;font-weight:600;">Prepared for: ${requirements.brokerName}</p>` : ''}
  </div>

  <div class="grid">
    <div class="grid-col">
      <div class="section">
        <div class="section-title">Company Information</div>
        <div class="field"><div class="field-label">Legal Name</div><div class="field-value">${data.carrierName}</div></div>
        <div class="field"><div class="field-label">DBA</div><div class="field-value">${data.dbaName || 'N/A'}</div></div>
        <div class="field"><div class="field-label">MC Number</div><div class="field-value">${data.mcNumber}</div></div>
        <div class="field"><div class="field-label">DOT Number</div><div class="field-value">${data.dotNumber}</div></div>
        <div class="field"><div class="field-label">SCAC Code</div><div class="field-value">${data.scacCode || 'N/A'}</div></div>
        <div class="field"><div class="field-label">EIN / Tax ID</div><div class="field-value">${data.ein}</div></div>
      </div>
    </div>
    <div class="grid-col">
      <div class="section">
        <div class="section-title">Contact Information</div>
        <div class="field"><div class="field-label">Address</div><div class="field-value">${data.address}</div></div>
        <div class="field"><div class="field-label">City, State, ZIP</div><div class="field-value">${data.city}, ${data.state} ${data.zip}</div></div>
        <div class="field"><div class="field-label">Phone</div><div class="field-value">${data.phone}</div></div>
        ${data.fax ? `<div class="field"><div class="field-label">Fax</div><div class="field-value">${data.fax}</div></div>` : ''}
        <div class="field"><div class="field-label">Email</div><div class="field-value">${data.email}</div></div>
        <div class="field"><div class="field-label">Primary Contact</div><div class="field-value">${data.primaryContact}${data.contactTitle ? `, ${data.contactTitle}` : ''}</div></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Insurance Certificates</div>
    <div class="grid">
      <div class="grid-col">
        <div class="insurance-box">
          <h4>AUTO LIABILITY</h4>
          <div class="field"><div class="field-label">Carrier</div><div class="field-value">${data.autoLiabilityCarrier}</div></div>
          <div class="field"><div class="field-label">Policy #</div><div class="field-value">${data.autoLiabilityPolicy}</div></div>
          <div class="field"><div class="field-label">Coverage</div><div class="field-value">$${data.autoLiabilityAmount.toLocaleString()}</div></div>
          <div class="field"><div class="field-label">Expires</div><div class="field-value">${data.autoLiabilityExpiry.toLocaleDateString()} <span class="badge badge-green">ACTIVE</span></div></div>
        </div>
      </div>
      <div class="grid-col">
        <div class="insurance-box">
          <h4>CARGO INSURANCE</h4>
          <div class="field"><div class="field-label">Carrier</div><div class="field-value">${data.cargoInsuranceCarrier}</div></div>
          <div class="field"><div class="field-label">Policy #</div><div class="field-value">${data.cargoInsurancePolicy}</div></div>
          <div class="field"><div class="field-label">Coverage</div><div class="field-value">$${data.cargoInsuranceAmount.toLocaleString()}</div></div>
          <div class="field"><div class="field-label">Expires</div><div class="field-value">${data.cargoInsuranceExpiry.toLocaleDateString()} <span class="badge badge-green">ACTIVE</span></div></div>
        </div>
      </div>
    </div>
    ${data.generalLiabilityCarrier ? `
    <div class="insurance-box" style="margin-top:10px;">
      <h4>GENERAL LIABILITY</h4>
      <div class="field"><div class="field-label">Carrier</div><div class="field-value">${data.generalLiabilityCarrier}</div></div>
      <div class="field"><div class="field-label">Policy #</div><div class="field-value">${data.generalLiabilityPolicy}</div></div>
      <div class="field"><div class="field-label">Coverage</div><div class="field-value">$${data.generalLiabilityAmount?.toLocaleString() || 'N/A'}</div></div>
    </div>` : ''}
  </div>

  <div class="grid">
    <div class="grid-col">
      <div class="section">
        <div class="section-title">Safety Information</div>
        <div class="field"><div class="field-label">CSA SMS Percentile</div><div class="field-value">${data.csaPercentile || 'N/A'}</div></div>
        <div class="field"><div class="field-label">Safety Rating</div><div class="field-value"><span class="badge badge-green">${data.safetyRating || 'Satisfactory'}</span></div></div>
        <div class="field"><div class="field-label">Out-of-Service Rate</div><div class="field-value">${data.oosRate || '0'}%</div></div>
      </div>
    </div>
    <div class="grid-col">
      <div class="section">
        <div class="section-title">Fleet Information</div>
        <div class="field"><div class="field-label">Equipment Types</div><div class="field-value">${data.equipmentTypes.join(', ')}</div></div>
        <div class="field"><div class="field-label">Power Units</div><div class="field-value">${data.numberOfTrucks}</div></div>
        <div class="field"><div class="field-label">Trailers</div><div class="field-value">${data.numberOfTrailers}</div></div>
      </div>
    </div>
  </div>

  ${data.tradeReferences && data.tradeReferences.length > 0 ? `
  <div class="section">
    <div class="section-title">Trade References</div>
    <table>
      <tr><th>Company</th><th>Contact</th><th>Phone</th></tr>
      ${data.tradeReferences.map(ref => `<tr><td>${ref.company}</td><td>${ref.contact}</td><td>${ref.phone}</td></tr>`).join('')}
    </table>
  </div>` : ''}

  ${data.factoringCompany ? `
  <div class="section">
    <div class="section-title">Payment Information</div>
    <div class="field"><div class="field-label">Factoring Company</div><div class="field-value">${data.factoringCompany}</div></div>
    ${data.bankName ? `<div class="field"><div class="field-label">Bank</div><div class="field-value">${data.bankName}</div></div>` : ''}
  </div>` : ''}

  <div class="section">
    <div class="section-title">Terms & Conditions</div>
    <p style="font-size:10px;color:#555;">
      The above-named carrier agrees to hold cargo insurance as stated and maintain operating authority in good standing with the FMCSA.
      All loads are accepted subject to the carrier's standard terms and conditions. Payment terms: Net 30 days from delivery date.
      Carrier warrants that all information provided is true and accurate.
    </p>
  </div>

  <div class="signature-row">
    <div>
      <div class="signature-line">${data.signatureName || data.primaryContact}${data.signatureTitle ? `, ${data.signatureTitle}` : ''}</div>
      <div style="font-size:9px;color:#888;margin-top:4px;">Date: ${data.signatureDate ? data.signatureDate.toLocaleDateString() : '___________'}</div>
    </div>
    <div>
      <div class="signature-line">For Broker Use: Authorized Signature</div>
      <div style="font-size:9px;color:#888;margin-top:4px;">Date: ___________</div>
    </div>
  </div>

  <div style="margin-top:20px;text-align:center;font-size:9px;color:#999;">
    Generated by Infamous Freight · ${new Date().toLocaleDateString()} ·
    This carrier packet is valid for 12 months from date of generation.
  </div>
</body>
</html>`;
  }

  private buildW9Html(data: CarrierPacketData): string {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>W-9</title>
<style>body{font-family:Arial;font-size:10px;padding:30px;}h1{font-size:16px;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #333;padding:6px;}</style>
</head><body>
<h1>Form W-9</h1>
<p><strong>Name:</strong> ${data.carrierName}</p>
<p><strong>Business Name (if different):</strong> ${data.dbaName || ''}</p>
<p><strong>Address:</strong> ${data.address}, ${data.city}, ${data.state} ${data.zip}</p>
<p><strong>EIN:</strong> ${data.ein}</p>
<p><strong>Tax Classification:</strong> Limited Liability Company</p>
</body></html>`;
  }

  private buildCOIHtml(data: CarrierPacketData): string {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>COI</title>
<style>body{font-family:Arial;font-size:10px;padding:30px;}h1{font-size:16px;color:#ff3d00;}</style>
</head><body>
<h1>CERTIFICATE OF INSURANCE</h1>
<p><strong>Named Insured:</strong> ${data.carrierName}</p>
<p><strong>MC#:</strong> ${data.mcNumber}</p>
<h3>Auto Liability: $${data.autoLiabilityAmount.toLocaleString()}</h3>
<p>Policy: ${data.autoLiabilityPolicy} · Carrier: ${data.autoLiabilityCarrier} · Expires: ${data.autoLiabilityExpiry.toLocaleDateString()}</p>
<h3>Cargo Insurance: $${data.cargoInsuranceAmount.toLocaleString()}</h3>
<p>Policy: ${data.cargoInsurancePolicy} · Carrier: ${data.cargoInsuranceCarrier} · Expires: ${data.cargoInsuranceExpiry.toLocaleDateString()}</p>
</body></html>`;
  }
}
