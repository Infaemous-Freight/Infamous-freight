import express from "express";

const app = express();
const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "api" });
});

app.listen(port, () => {
  console.log(`Infamous Freight API listening on port ${port}`);
});
