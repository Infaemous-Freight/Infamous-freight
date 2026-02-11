"use client";

import axios from "axios";
import { useState } from "react";

export default function Dashboard() {
  const [profit, setProfit] = useState<number | null>(null);

  const runAI = async () => {
    const res = await axios.post("http://localhost:8000/optimize", {
      origin: "OKC",
      destination: "Dallas",
      weight: 12000,
      miles: 210
    });
    setProfit(res.data.estimated_profit);
  };

  return (
    <div className="p-10">
      <button onClick={runAI}>Run AI Optimization</button>
      {profit !== null && <p>Estimated Profit: ${profit}</p>}
    </div>
  );
}
