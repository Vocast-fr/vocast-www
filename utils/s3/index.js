const aws = require('aws-sdk')
const fs = require('fs-extra')

const { AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_S3_BUCKET } = process.env

const s3 = new aws.S3({
  credentials: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
})

function uploadToS3 (data, s3Path, ACL = 'public-read') {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      Bucket: AWS_S3_BUCKET,
      Key: s3Path,
      Body: data,
      ACL
    }
    s3.upload(uploadOptions, function (err, data) {
      if (err) reject(err)
      resolve(data.Location)
    })
  })
}

function uploadLocalFileToS3 (localPath, s3Path, ACL) {
  return new Promise((resolve, reject) => {
    fs.readFile(localPath, function (err, data) {
      try {
        if (err) {
          reject(new Error(`Can't read file ${localPath}`))
        }

        uploadToS3(data, s3Path, ACL)
          .then(resolve)
          .catch(reject)
      } catch (e) {
        reject(e)
      }
    })
  })
}

module.exports = {
  uploadToS3,
  uploadLocalFileToS3
}
