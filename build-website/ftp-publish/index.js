const FtpDeploy = require('ftp-deploy')
const ftpDeploy = new FtpDeploy()

module.exports = async wwwFinalFolder => {
  const debug = require('debug')('vocast-tools/ftp-publish')

  const { FTP_DIR, FTP_HOST, FTP_PASS, FTP_USER } = process.env
  const config = {
    user: FTP_USER,
    password: FTP_PASS,
    host: FTP_HOST,
    port: 21,
    localRoot: wwwFinalFolder,
    remoteRoot: FTP_DIR,
    include: ['*', '**/*'], // this would upload everything except dot files
    exclude: ['*.map'], // e.g. exclude sourcemaps
    deleteRemote: false // delete existing files at destination before uploading
  }

  // use with promises
  debug('Ready to deploy...')
  await ftpDeploy.deploy(config)
  debug('Deployed to FTP !')
}
