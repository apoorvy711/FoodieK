const { Queue } = require("bullmq");
const connection = require("../config/bullmq.config");

const emailQueue = new Queue("emailQueue", {
  connection,
});

module.exports = emailQueue;
