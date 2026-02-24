"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { loginWithEmail } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await loginWithEmail(email, password);
      router.push("/dashboard");
    } catch {
      setError("Login failed. Verify your credentials.");
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Login</h1>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <input
          className="rounded border p-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="rounded border p-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
        />
        <button className="rounded bg-black p-2 text-white" type="submit">
          Sign in
        </button>
      </form>
      {error ? <p className="mt-3 text-red-600">{error}</p> : null}
    </main>
  );
}
