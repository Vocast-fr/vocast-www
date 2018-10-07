const fileExtension = require('file-extension')
const fs = require('fs-extra')
const superagent = require('superagent')

const os = require('os')
const TMP_PATH = os.tmpdir()

function downloadFromUrl (url, fileName) {
  return new Promise((resolve, reject) => {
    const ext = fileExtension(url)
    const stream = fs.createWriteStream(`${TMP_PATH}/${fileName}.${ext}`)
    stream.on('finish', () => resolve(stream.path))
    stream.on('error', err => {
      console.error('Error with stream for ddl', err)
      reject(err)
    })

    superagent.get(url).pipe(stream)
  })
}

module.exports = {
  downloadFromUrl
}
