export const additionalPaths = {
  "/auth/login": {
    post: {
      summary: "Issue access and refresh tokens",
      security: [],
      responses: { "200": { description: "Authenticated" } }
    }
  },
  "/auth/refresh": {
    post: {
      summary: "Refresh access token",
      security: [],
      responses: { "200": { description: "Access token refreshed" } }
    }
  },
  "/auth/revoke": {
    post: {
      summary: "Revoke refresh token",
      security: [],
      responses: { "200": { description: "Refresh token revoked" } }
    }
  },
  "/tracking/gps/ingest": {
    post: {
      summary: "Ingest driver GPS ping",
      responses: { "201": { description: "GPS ping ingested" } }
    }
  }
};
