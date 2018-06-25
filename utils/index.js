const date = require("./date");
const s3 = require("./s3");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  sleep,
  ...date,
  ...s3
};
