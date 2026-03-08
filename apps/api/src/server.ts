import { createApp } from "./app.js";

const app = createApp();
const port = Number(process.env.PORT || 4000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Infamous Freight API running on :${port}`);
});
