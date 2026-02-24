"use client";

import { useEffect, useState } from "react";

type Load = {
  id: string;
  rate: number;
  status: string;
};

export default function Dashboard() {
  const [loads, setLoads] = useState<Load[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/loads", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(setLoads)
      .catch(() => setLoads([]));
  }, []);

  return (
    <div className="min-h-screen bg-black p-8 text-green-400">
      <h1 className="mb-6 text-3xl">INFÆMOUS FREIGHT</h1>
      {loads.map((load) => (
        <div key={load.id} className="mb-2 border p-4">
          ${load.rate} • {load.status}
        </div>
      ))}
    </div>
  );
}
