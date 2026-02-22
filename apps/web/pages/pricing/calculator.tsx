"use client";

import { useState } from "react";

interface ShipmentData {
  weight: number;
  distance: number;
  urgency: "standard" | "express" | "overnight";
  origin: string;
  destination: string;
}

interface CostBreakdown {
  baseCost: number;
  weightSurcharge: number;
  distanceCost: number;
  surgeMultiplier: number;
  totalCost: number;
}

export default function CostCalculator(): React.ReactElement {
  const [shipment, setShipment] = useState<ShipmentData>({
    weight: 10,
    distance: 100,
    urgency: "standard",
    origin: "",
    destination: "",
  });

  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculateCost = async () => {
    setCalculating(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pricing/calculate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(shipment),
        },
      );
      const data = await response.json();
      setCosts(data.data);
    } catch {
      // Error handled silently for user experience
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px" }}>
      <h1>Shipping Cost Calculator</h1>

      <div
        style={{
          backgroundColor: "#f9f9f9",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <div style={{ marginBottom: "15px" }}>
          <label>Weight (lbs): </label>
          <input
            type="number"
            min="1"
            value={shipment.weight}
            onChange={(e) => setShipment({ ...shipment, weight: parseFloat(e.target.value) })}
            style={{ marginLeft: "10px", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Distance (miles): </label>
          <input
            type="number"
            min="1"
            value={shipment.distance}
            onChange={(e) => setShipment({ ...shipment, distance: parseFloat(e.target.value) })}
            style={{ marginLeft: "10px", padding: "8px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Urgency: </label>
          <select
            value={shipment.urgency}
            onChange={(e) =>
              setShipment({ ...shipment, urgency: e.target.value as ShipmentData["urgency"] })
            }
            style={{ marginLeft: "10px", padding: "8px" }}
          >
            <option value="standard">Standard (3-5 days)</option>
            <option value="express">Express (1-2 days)</option>
            <option value="overnight">Overnight</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Origin: </label>
          <input
            type="text"
            placeholder="City, State"
            value={shipment.origin}
            onChange={(e) => setShipment({ ...shipment, origin: e.target.value })}
            style={{ marginLeft: "10px", padding: "8px", width: "200px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Destination: </label>
          <input
            type="text"
            placeholder="City, State"
            value={shipment.destination}
            onChange={(e) => setShipment({ ...shipment, destination: e.target.value })}
            style={{ marginLeft: "10px", padding: "8px", width: "200px" }}
          />
        </div>

        <button
          onClick={calculateCost}
          disabled={calculating}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {calculating ? "Calculating..." : "Calculate Cost"}
        </button>
      </div>

      {costs && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ffc107",
          }}
        >
          <h2>Cost Breakdown</h2>
          <p>Base Cost: ${costs.baseCost.toFixed(2)}</p>
          <p>Weight Surcharge: ${costs.weightSurcharge.toFixed(2)}</p>
          <p>Distance Cost: ${costs.distanceCost.toFixed(2)}</p>
          <p>Urgency Multiplier: {costs.surgeMultiplier}x</p>
          <hr />
          <h3 style={{ color: "#d9534f" }}>Total Estimated Cost: ${costs.totalCost.toFixed(2)}</h3>
          <p style={{ fontSize: "12px", color: "#666" }}>
            * Pricing is estimated and final cost may vary based on actual conditions
          </p>
        </div>
      )}
    </div>
  );
}
