// Minimal API config provider
module.exports = {
  getApiConfig() {
    return {
      port: Number(process.env.API_PORT || 4000),
    };
  },
};
