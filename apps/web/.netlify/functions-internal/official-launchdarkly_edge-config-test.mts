// src/functions/edge-config-test.mts
var edge_config_test_default = async (req) => {
  const requestKey = req.headers.get("Authorization")?.split(" ")[1];
  const sharedKey = Netlify.env.get("LAUNCHDARKLY_SHARED_SECRET");
  if (sharedKey === void 0 || sharedKey === "" || requestKey !== sharedKey) {
    return new Response("Authorization missing.", { status: 401 });
  }
  return new Response(JSON.stringify({ success: true }));
};
var config = {
  method: "GET",
  path: "/.official-launchdarkly/edge-config-test"
};
export {
  config,
  edge_config_test_default as default
};
