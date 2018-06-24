async function main () {
  try {
    require('dotenv').config()
    const podcastsMap = require('../podcastsMap.json')
    const podcastsMapFulfiller = require('./podcastsMap-fulfiller')
    const wwwGenerator = require('./www-gen')

    console.log('MAIN build-site: Start!')

    podcastsMapFulfiller(podcastsMap)
      .then(wwwGenerator)
      .then(() => {
        if (process.env.DEV) {
          while (true) {}
        }
        console.log('MAIN build-site: Process ended.')
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
