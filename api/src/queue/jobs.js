// Job payload contracts

/**
 * @typedef {Object} DispatchWaveJob
 * @property {string} jobId
 * @property {1|2|3} wave
 */

/**
 * @typedef {{ scope: "global" } | { scope: "job", jobId: string }} ExpireOffersJob
 */

/**
 * @typedef {{ scope: "global" }} ExpireHoldsJob
 */

/**
 * @typedef {Object} EtaJob
 * @property {string} jobId
 * @property {string[]} candidateDriverIds
 */

module.exports = {};
