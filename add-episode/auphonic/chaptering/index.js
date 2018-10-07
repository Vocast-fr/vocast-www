const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs-extra')
const os = require('os')

const { uploadLocalFileToS3 } = require('../../../utils')

const TMP_PATH = os.tmpdir()
ffmpeg.setFfmpegPath(ffmpegPath)

module.exports = (
  chapter,
  { tmpCompleteFilePath, tmpCompleteFileExt, s3Folder }
) =>
  new Promise(async (resolve, reject) => {
    try {
      const { title, start, durationSec } = chapter

      const debug = require('debug')(`vocast-tools/auphonic/chapter/${title}`)

      const tmpChapterFilePath = `${TMP_PATH}/${+new Date()}.${tmpCompleteFileExt}`
      const s3Path = `${s3Folder}/${title}.${tmpCompleteFileExt}`

      debug('Ready for FFMPEG (truncate)...')
      ffmpeg(tmpCompleteFilePath)
        .setStartTime(start)
        .setDuration(durationSec)
        .output(tmpChapterFilePath)
        .on('end', () => {
          debug(
            `FFMPEG end, ready to upload from ${tmpChapterFilePath} to ${s3Path}`
          )
          uploadLocalFileToS3(tmpChapterFilePath, s3Path)
            .then(s3Location => {
              debug(`Extract uploaded to S3 : ${s3Location}`)
              fs.removeSync(tmpChapterFilePath)
              resolve(s3Location)
            })
            .catch(reject)
        })
        .on('error', err => {
          console.error('ffmpeg error::', err)
          reject(err)
        })
        .run()
    } catch (e) {
      console.error('error caught error in chaptering::', e)
      reject(e)
    }
  })
