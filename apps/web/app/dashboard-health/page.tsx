"use client";

import Link from "next/link";
import { auth, db } from "@/lib/firebase";

export default function DashboardHealthPage() {
  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Dashboard Health</h1>
      <p>Firebase Auth initialized: {auth ? "yes" : "no"}</p>
      <p>Firestore initialized: {db ? "yes" : "no"}</p>
      <ul>
        <li><Link href="/">Homepage</Link></li>
        <li><Link href="/status">Status</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/login">Login</Link></li>
        <li><Link href="/driver">Driver</Link></li>
      </ul>
    </main>
  );
}
