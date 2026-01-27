const app = require("./server");

const port = process.env.API_PORT || 4000;

if (app && typeof app.listen === "function") {
  app.listen(port, () => {
    // Basic startup log; structured logging handled elsewhere
    console.log(`API server listening on port ${port}`);
  });
}
