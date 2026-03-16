import { createApp } from "./app.js";

const app = createApp();
const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 4000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Infæmous Freight API running on :${port}`);
});
