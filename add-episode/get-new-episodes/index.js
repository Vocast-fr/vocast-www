const debug = require('debug')('vocast-tools/get-new-episode')

const { getFromDb } = require('../../utils')

module.exports = async () => {
  const { DB_EPISODES, DB_PODCASTS } = process.env

  let newEpisodes = await getFromDb(DB_EPISODES, { auphonic_uuid: null })

  newEpisodes = newEpisodes.filter(newEpisode => {
    const { podcast: podcastSlug, slug } = newEpisode
    return slug !== `${podcastSlug}@`
  })

  debug(`Got ${newEpisodes.length} new episodes`)

  return Promise.all(
    newEpisodes.map(async newEpisode => {
      const { podcast: podcastSlug } = newEpisode
      const [podcast] = await getFromDb(DB_PODCASTS, { slug: podcastSlug })

      debug(`Got an episode for podcast "${podcast.title}"`)

      return { episode: newEpisode, podcast }
    })
  )
}
