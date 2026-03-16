/**
 * Document OCR Service
 * Optical Character Recognition for freight documents (BOL, receipts, invoices, permits)
 */

const { logger } = require("../middleware/logger");
const OpenAI = require("openai");
const { Anthropic } = require("@anthropic-ai/sdk");

class DocumentOCRService {
  constructor() {
    this.openai = null;
    this.anthropic = null;

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }

    // Supported document types
    this.documentTypes = {
      BOL: "Bill of Lading",
      POD: "Proof of Delivery",
      INVOICE: "Invoice",
      RECEIPT: "Receipt",
      PERMIT: "Permit",
      INSPECTION: "Inspection Report",
      MANIFEST: "Cargo Manifest",
      PACKING_LIST: "Packing List",
    };

    // Field extraction templates
    this.extractionTemplates = {
      BOL: [
        "shipperName",
        "shipperAddress",
        "consigneeName",
        "consigneeAddress",
        "bolNumber",
        "date",
        "carrier",
        "weight",
        "pieces",
        "description",
        "specialInstructions",
        "freightCharges",
      ],
      POD: [
        "deliveryDate",
        "deliveryTime",
        "recipientName",
        "recipientSignature",
        "bolNumber",
        "condition",
        "notes",
      ],
      INVOICE: [
        "invoiceNumber",
        "invoiceDate",
        "dueDate",
        "billingAddress",
        "shipmentId",
        "description",
        "quantity",
        "rate",
        "amount",
        "subtotal",
        "tax",
        "total",
      ],
      RECEIPT: ["date", "vendor", "amount", "category", "paymentMethod", "items"],
      PERMIT: [
        "permitNumber",
        "issueDate",
        "expiryDate",
        "jurisdiction",
        "vehicle",
        "restrictions",
        "fee",
      ],
    };
  }

  /**
   * Extract text and data from document image
   */
  async processDocument(imageBuffer, documentType = "BOL", options = {}) {
    try {
      logger.info("Processing document", { documentType, size: imageBuffer.length });

      // Convert buffer to base64
      const base64Image = imageBuffer.toString("base64");
      const mimeType = options.mimeType || "image/jpeg";

      // Extract text using vision API
      const extractedText = await this.extractTextFromImage(base64Image, mimeType);

      // Parse structured data based on document type
      const structuredData = await this.extractStructuredData(extractedText, documentType);

      // Validate extracted data
      const validation = this.validateExtractedData(structuredData, documentType);

      // Calculate confidence score
      const confidence = this.calculateConfidence(structuredData, validation);

      const result = {
        documentType,
        extractedText,
        structuredData,
        validation,
        confidence,
        metadata: {
          imageSize: imageBuffer.length,
          processedAt: new Date().toISOString(),
          provider: this.getActiveProvider(),
        },
      };

      logger.info("Document processed", {
        documentType,
        confidence,
        fieldsExtracted: Object.keys(structuredData).length,
      });

      return result;
    } catch (error) {
      logger.error({ error }, "Document processing error");
      throw error;
    }
  }

  /**
   * Extract raw text from image using Vision API
   */
  async extractTextFromImage(base64Image, mimeType) {
    try {
      // Try OpenAI GPT-4 Vision first
      if (this.openai) {
        return await this.extractWithOpenAI(base64Image, mimeType);
      }

      // Fallback to Anthropic Claude Vision
      if (this.anthropic) {
        return await this.extractWithClaude(base64Image, mimeType);
      }

      // No API available - return mock result
      logger.warn("No OCR provider configured, using mock extraction");
      return this.mockTextExtraction();
    } catch (error) {
      logger.error({ error }, "Text extraction error");
      throw error;
    }
  }

  /**
   * Extract structured data from text
   */
  async extractStructuredData(text, documentType) {
    try {
      const fields = this.extractionTemplates[documentType] || [];

      if (fields.length === 0) {
        return { rawText: text };
      }

      // Use AI to extract structured fields
      if (this.anthropic || this.openai) {
        return await this.aiStructuredExtraction(text, documentType, fields);
      }

      // Fallback to regex-based extraction
      return this.regexBasedExtraction(text, documentType, fields);
    } catch (error) {
      logger.error({ error }, "Structured data extraction error");
      return { rawText: text };
    }
  }

  /**
   * Validate extracted data
   */
  validateExtractedData(data, documentType) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
    };

    const requiredFields = this.getRequiredFields(documentType);

    // Check required fields
    for (const field of requiredFields) {
      if (!data[field] || data[field] === "") {
        validation.valid = false;
        validation.errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate specific field formats
    if (data.bolNumber && !/^[A-Z0-9-]+$/.test(data.bolNumber)) {
      validation.warnings.push("BOL number format may be incorrect");
    }

    if (data.date && !this.isValidDate(data.date)) {
      validation.warnings.push("Date format may be incorrect");
    }

    if (data.weight && isNaN(parseFloat(data.weight))) {
      validation.warnings.push("Weight value may be incorrect");
    }

    return validation;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(data, validation) {
    let score = 100;

    // Deduct for missing fields
    score -= validation.errors.length * 15;

    // Deduct for warnings
    score -= validation.warnings.length * 5;

    // Deduct for empty values
    const emptyFields = Object.values(data).filter((v) => !v || v === "").length;
    score -= emptyFields * 3;

    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Batch process multiple documents
   */
  async batchProcessDocuments(documents) {
    try {
      logger.info("Batch processing documents", { count: documents.length });

      const results = await Promise.all(
        documents.map((doc) =>
          this.processDocument(doc.buffer, doc.type, doc.options).catch((error) => ({
            error: error.message,
            documentId: doc.id,
          })),
        ),
      );

      const summary = {
        total: documents.length,
        successful: results.filter((r) => !r.error).length,
        failed: results.filter((r) => r.error).length,
        averageConfidence:
          results.filter((r) => !r.error).reduce((sum, r) => sum + r.confidence, 0) /
          results.length,
        results,
      };

      logger.info("Batch processing complete", summary);

      return summary;
    } catch (error) {
      logger.error({ error }, "Batch processing error");
      throw error;
    }
  }

  // ========== Private Helper Methods ==========

  async extractWithOpenAI(base64Image, mimeType) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // GPT-4 with vision
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text from this document. Return the text exactly as it appears, preserving formatting and structure.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    return response.choices[0].message.content;
  }

  async extractWithClaude(base64Image, mimeType) {
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "Extract all text from this document. Return the text exactly as it appears, preserving formatting and structure.",
            },
          ],
        },
      ],
    });

    return response.content[0].text;
  }

  async aiStructuredExtraction(text, documentType, fields) {
    const prompt = `Extract the following fields from this ${documentType} document text:
${fields.join(", ")}

Document text:
${text}

Return a JSON object with the extracted fields. Use null for fields that cannot be found.`;

    let response;
    if (this.anthropic) {
      const result = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });
      response = result.content[0].text;
    } else if (this.openai) {
      const result = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
      response = result.choices[0].message.content;
    }

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { rawText: text };
  }

  regexBasedExtraction(text, documentType, fields) {
    const data = {};

    // Common patterns
    const patterns = {
      bolNumber: /BOL\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      invoiceNumber: /INVOICE\s*#?\s*:?\s*([A-Z0-9-]+)/i,
      date: /DATE\s*:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
      weight: /WEIGHT\s*:?\s*([\d,]+)\s*(lbs?|kg)/i,
      amount: /TOTAL\s*:?\s*\$?([\d,]+\.?\d*)/i,
      phone: /(\d{3}[-.]?\d{3}[-.]?\d{4})/,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    };

    // Apply patterns
    for (const [field, pattern] of Object.entries(patterns)) {
      if (fields.includes(field)) {
        const match = text.match(pattern);
        if (match) {
          data[field] = match[1];
        }
      }
    }

    return data;
  }

  getRequiredFields(documentType) {
    const required = {
      BOL: ["bolNumber", "shipperName", "consigneeName"],
      POD: ["deliveryDate", "recipientName"],
      INVOICE: ["invoiceNumber", "total"],
      RECEIPT: ["date", "amount"],
      PERMIT: ["permitNumber", "expiryDate"],
    };

    return required[documentType] || [];
  }

  isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }

  getActiveProvider() {
    if (this.openai) return "OpenAI GPT-4 Vision";
    if (this.anthropic) return "Anthropic Claude Vision";
    return "Mock (No API configured)";
  }

  mockTextExtraction() {
    return `BILL OF LADING
BOL #: BOL-2024-12345
Date: 01/15/2024

SHIPPER:
ABC Logistics Inc.
123 Main Street
Chicago, IL 60601

CONSIGNEE:
XYZ Distribution Center
456 Oak Avenue
Los Angeles, CA 90001

CARRIER: Infæmous Freight Enterprises

DESCRIPTION OF GOODS:
Electronics - Laptops
Weight: 2,500 lbs
Pieces: 10 pallets

Freight Charges: $2,450.00`;
  }
}

// Export singleton instance
module.exports = new DocumentOCRService();
