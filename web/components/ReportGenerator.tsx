/**
 * ReportGenerator Component
 * Generates and exports shipment reports
 */

import React from "react";

interface ReportGeneratorProps {
  shipmentId?: string;
  onExport?: (format: string) => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  shipmentId,
  onExport,
}) => {
  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Report Generator</h2>
      {shipmentId ? (
        <p className="text-xs text-gray-500 mb-4">Shipment: {shipmentId}</p>
      ) : null}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Report Format
          </label>
          <select className="w-full border border-gray-300 rounded px-3 py-2">
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={() => onExport?.("pdf")}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default ReportGenerator;
