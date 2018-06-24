async function main () {
  try {
    require('dotenv').config()
    const podcastsMap = require('../podcastsMap.json')
    const newEpisode = require('../newEpisode.json')
    const auphonicProcess = require('./auphonic')
    const savePodcastMap = require('./save-podcastMap')

    console.log('MAIN add-episode: Start!')

    auphonicProcess(podcastsMap, newEpisode)
      .then(savePodcastMap)
      .then(() => {
        console.log('MAIN add-episode: Process ended.')
      })
      .catch(e => {
        console.error('EXECUTION add-episode error', e)
      })
  } catch (e) {
    console.error('MAIN add-episode: Error ', e)
  }
}

main().catch(e => {
  console.error('GLOBAL: Error', e)
})
