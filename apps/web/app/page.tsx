import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">INFÆMOUS FREIGHT Dispatcher</h1>
      <p className="mt-3">MVP v1 foundation with auth, billing, and load ops.</p>
      <div className="mt-5 flex gap-3">
        <Link href="/login" className="rounded bg-black px-4 py-2 text-white">
          Login
        </Link>
        <Link href="/register" className="rounded border px-4 py-2">
          Register
        </Link>
      </div>
    </main>
  );
}
