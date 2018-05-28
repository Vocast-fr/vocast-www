async function main () {
  try {
    require('dotenv').config()
    const podcastsMap = require('../podcastsMap.json')
    const podcastsMapFulfiller = require('./podcastsMapFulfiller')
    const wwwGenerator = require('./www-gen')

    podcastsMapFulfiller(podcastsMap)
      .then(wwwGenerator)
      .then(() => {
        console.log('MAIN: OK!')
        if (process.env.DEV) { 
           while (true) {}
        }
           console.log('MAIN: Process ended.')
      })
      .catch(e => {
        console.error('EXECUTION error', e)
      })
  } catch (e) {
    console.error('MAIN: Error ', e)
  }
}

main().catch(e => {
  console.error('GLOBAL: Error', e)
})
