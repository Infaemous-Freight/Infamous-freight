const { Queue } = require("bullmq");
const { connection } = require("./connection");

const dispatchQueue = new Queue("dispatch", { connection });
const expiryQueue = new Queue("expiry", { connection });
const etaQueue = new Queue("eta", { connection });

module.exports = { dispatchQueue, expiryQueue, etaQueue };
