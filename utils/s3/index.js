const aws = require("aws-sdk");
const fs = require("fs-extra");
var s3urls = require("s3urls");

const { AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_S3_BUCKET } = process.env;

const s3 = new aws.S3({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
});

function uploadToS3(data, s3Path) {
  return new Promise((resolve, reject) => {
    const putObjectOptions = {
      Bucket: AWS_S3_BUCKET,
      Key: s3Path,
      Body: data,
      ACL: "public-read"
    };
    s3.putObject(putObjectOptions, function(err, res) {
      if (err) reject(err);
      const urls = s3urls.toUrl(AWS_S3_BUCKET, s3Path);
      resolve(urls["bucket-in-host"]);
    });
  });
}

function uploadLocalFileToS3(localPath, s3Path) {
  return new Promise((resolve, reject) => {
    fs.readFile(localPath, function(err, data) {
      try {
        if (err) {
          reject(new Error(`Can't read file ${localPath}`));
        }

        uploadToS3(data, s3Path)
          .then(resolve)
          .catch(reject);
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = {
  uploadToS3,
  uploadLocalFileToS3
};
