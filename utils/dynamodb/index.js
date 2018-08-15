require("dotenv").config();

const aws = require("aws-sdk");
const { Marshaller } = require("@aws/dynamodb-auto-marshaller");

const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env;

const dynamodb = new aws.DynamoDB({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  },
  region: "eu-west-3"
});

const marshaller = new Marshaller({ unwrapNumbers: true });

async function getFromDb(TableName, inputFilter) {
  return new Promise((resolve, reject) => {
    const scanObj = { TableName };
    const hasFilter = inputFilter && Object.keys(inputFilter).length > 0;

    if (hasFilter) {
      const filter = {};
      Object.keys(inputFilter).forEach(k => {
        filter[`:${k}`] = inputFilter[k];
      });
      const ExpressionAttributeValues = marshaller.marshallItem(filter);

      const FilterExpression = Object.keys(inputFilter)
        .map(k => `${k} = :${k}`)
        .join(" and ");

      Object.assign(scanObj, {
        ExpressionAttributeValues,
        FilterExpression
      });
      //console.log(ExpressionAttributeValues, FilterExpression);
    }

    dynamodb.scan(scanObj, function(err, data) {
      if (err) reject(err);
      else {
        const items = data.Items.map(item => {
          return marshaller.unmarshallItem(item);
        });
        resolve(items);
      }
    });
  });
}

async function putDb(TableName, obj) {
  return new Promise((resolve, reject) => {
    const Item = marshaller.marshallItem(obj);

    dynamodb.putItem(
      {
        Item,
        TableName
      },
      (err, data) => {
        if (err) reject(err);
        else {
          resolve(data);
        }
      }
    );
  });
}

module.exports = {
  getFromDb,
  putDb
};
