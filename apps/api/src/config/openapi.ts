import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const doc = {
  openapi: "3.0.3",
  info: {
    title: "Infamous Freight API",
    version: "1.0.0"
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        security: [],
        responses: {
          "200": { description: "OK" }
        }
      }
    },
    "/loads": {
      get: {
        summary: "List loads",
        responses: { "200": { description: "Loads listed" } }
      },
      post: {
        summary: "Create load",
        responses: { "201": { description: "Load created" } }
      }
    },
    "/dispatch/{loadId}/recommend": {
      post: {
        summary: "Recommend drivers",
        parameters: [
          {
            name: "loadId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: { "200": { description: "Recommendations returned" } }
      }
    },
    "/dispatch/{loadId}/assign/{driverId}": {
      post: {
        summary: "Assign driver to load",
        parameters: [
          {
            name: "loadId",
            in: "path",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "driverId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: { "200": { description: "Load assigned" } }
      }
    },
    "/anomalies/gps/{driverId}/evaluate": {
      post: {
        summary: "Evaluate driver GPS anomalies",
        parameters: [
          {
            name: "driverId",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: { "200": { description: "Anomaly evaluation returned" } }
      }
    }
  }
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, "../docs/openapi.json");

await fs.writeFile(outputPath, JSON.stringify(doc, null, 2), "utf8");
console.log(`Wrote ${outputPath}`);
