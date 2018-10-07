const date = require('./date')
const dynamodb = require('./dynamodb')
const s3 = require('./s3')
const request = require('./request')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = {
  sleep,
  ...date,
  ...dynamodb,
  ...request,
  ...s3
}
