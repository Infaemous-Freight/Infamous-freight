/**
 * Export Service
 * Handles data export in multiple formats
 */

const PDFDocument = require("pdfkit");
const { parse } = require("json2csv");
const { logger } = require("../middleware/logger");

class ExportService {
  /**
   * Export data to CSV
   */
  exportToCSV(data, fields = null) {
    try {
      const csv = parse(data, { fields });
      return csv;
    } catch (error) {
      logger.error({ error }, 'CSV export error');
      throw error;
    }
  }

  /**
   * Export data to PDF
   */
  async exportToPDF(data, title = "Report") {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks = [];

        doc.on("data", (chunk) => {
          chunks.push(chunk);
        });

        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        // Add title
        doc.fontSize(16).text(title, { align: "center" });
        doc.moveDown();

        // Add content
        if (Array.isArray(data)) {
          data.forEach((item) => {
            doc.fontSize(10).text(JSON.stringify(item));
            doc.moveDown(0.5);
          });
        } else {
          doc.fontSize(10).text(JSON.stringify(data));
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export data to JSON
   */
  exportToJSON(data) {
    return JSON.stringify({ data }, null, 2);
  }

  /**
   * Export to format
   */
  async exportToFormat(format, data, options = {}) {
    switch (format.toLowerCase()) {
      case "csv":
        return this.exportToCSV(data, options.fields);
      case "pdf":
        return await this.exportToPDF(data, options.title);
      case "json":
        return this.exportToJSON(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

module.exports = new ExportService();
