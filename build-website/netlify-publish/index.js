const debug = require('debug')('vocast-tools/netlify-publish')
const NetlifyAPI = require('netlify')
const path = require('path')

module.exports = async wwwFinalFolder => {
  const {
    NETLIFY_ACCESS_TOKEN,
    NETLIFY_CONFIG,
    NETLIFY_SITEID
  } = process.env

  const client = new NetlifyAPI(NETLIFY_ACCESS_TOKEN)

  // use with promises
  debug('Ready to deploy to Netlify...')

  const deploy = await client.deploy(NETLIFY_SITEID, wwwFinalFolder, {
    configPath: path.resolve(__dirname, `../../${NETLIFY_CONFIG}`)
  })

  // debug(deploy)
  debug('Deployed to Netlify !')
}
