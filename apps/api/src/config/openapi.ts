import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const doc = {
  openapi: "3.0.3",
  info: {
    title: "Infamous Freight API",
    version: "1.0.0"
  },
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    },
    "/loads": {
      get: {
        summary: "List loads"
      },
      post: {
        summary: "Create load"
      }
    },
    "/dispatch/{loadId}/recommend": {
      post: {
        summary: "Recommend drivers for a load"
      }
    },
    "/dispatch/{loadId}/assign/{driverId}": {
      post: {
        summary: "Assign driver to load"
      }
    },
    "/anomalies/gps/{driverId}/evaluate": {
      post: {
        summary: "Evaluate GPS anomalies for a driver"
      }
    }
  }
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "../docs/openapi.json");

await fs.writeFile(outputPath, JSON.stringify(doc, null, 2), "utf8");
console.log(`Wrote ${outputPath}`);
