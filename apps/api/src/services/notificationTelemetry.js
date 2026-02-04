const state = {
  lastTwilio: null,
};

function recordTwilioSend(payload) {
  state.lastTwilio = {
    ...payload,
    recordedAt: new Date().toISOString(),
  };
}

function recordTwilioStatus(payload) {
  state.lastTwilio = {
    ...state.lastTwilio,
    ...payload,
    recordedAt: new Date().toISOString(),
  };
}

function getLastTwilioStatus() {
  return state.lastTwilio;
}

module.exports = {
  recordTwilioSend,
  recordTwilioStatus,
  getLastTwilioStatus,
};
