const { PredictionServiceClient } = require('@google-cloud/aiplatform');

const client = new PredictionServiceClient();

async function predictETA(shipmentFeatures) {
  const endpoint =
    'projects/YOUR_PROJECT/locations/us-central1/endpoints/YOUR_ENDPOINT_ID';

  const [response] = await client.predict({
    endpoint,
    instances: [shipmentFeatures],
  });

  return response.predictions[0];
}

module.exports = {
  predictETA,
};
