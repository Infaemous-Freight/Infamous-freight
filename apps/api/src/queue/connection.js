const { redisConnection } = require("./redis");

const connection = redisConnection();

module.exports = { connection };
