require('dotenv').config()
const debug = require('debug')('vocast-tools/build-website')
const podcastsMapFulfiller = require('./podcastsMap-fulfiller')
const wwwGenerator = require('./www-gen')
const ftpPublish = require('./ftp-publish')
const netlifyPublish = require('./netlify-publish')

const {
  DEV,
  FTP_DIR,
  FTP_HOST,
  FTP_PASS,
  FTP_USER,
  NETLIFY_ACCESS_TOKEN,
  NETLIFY_CONFIG,
  NETLIFY_SITEID
} = process.env

async function main () {
  try {
    debug('Start!')

    podcastsMapFulfiller()
      .then(wwwGenerator)
      .then(wwwFinalFolder => {
        if (DEV) {
          while (true) { }
        }
        return wwwFinalFolder
      })
      .then(async wwwFinalFolder => {
        if (FTP_DIR && FTP_HOST && FTP_PASS && FTP_USER) {
          await ftpPublish(wwwFinalFolder)
        }
        if (NETLIFY_ACCESS_TOKEN && NETLIFY_CONFIG && NETLIFY_SITEID) {
          await netlifyPublish(wwwFinalFolder)
        }
      })
      .then(() => {
        debug('Ended with success')
      })
      .catch(e => {
        console.error('EXECUTION build-site error', e)
      })
  } catch (e) {
    console.error('MAIN build-site: Error ', e)
  }
}

main().catch(e => {
  console.error('GLOBAL: Error', e)
})
