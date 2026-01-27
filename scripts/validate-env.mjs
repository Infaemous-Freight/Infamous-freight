const required = ["NEXT_PUBLIC_API_URL"];

const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error("Missing required env vars:", missing.join(", "));
  process.exit(1);
}

console.log("Env OK");
