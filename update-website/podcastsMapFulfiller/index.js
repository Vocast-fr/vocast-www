const moment = require('moment')

const { dateSort } = require('../../utils/date')

module.exports = async podcastsMap => {
  const {
    CONTACT,
    GA_ID,
    MAX_EPISODES_MENU,
    WWW_BASE,
    HTML_AND_MOMENT_LANG
  } = process.env

  moment.locale(HTML_AND_MOMENT_LANG) // default the locale

  /***********************************
   ** podcastsMap.podcasts fulfill ***
   ***********************************/

  Object.keys(podcastsMap.podcasts).forEach(podcastKey => {
    const podcastPath = podcastKey
    podcastsMap.podcasts[podcastKey].podcastPath = podcastPath

    const episodes = podcastsMap.podcasts[podcastKey].episodes
    podcastsMap.podcasts[podcastKey].episodes = episodes
      .map(e =>
        Object.assign(
          {
            friendlyDate: moment(e.date).format('LL'),
            episodePath: `${podcastPath}/s${e.season}e${e.episode}.html`
          },
          e
        )
      )
      .sort((a, b) => dateSort(a.date, b.date, false))
  })

  /***********************************
   ************* HEADER **************
   ***********************************/

  podcastsMap.header.year = moment().year()
  podcastsMap.header.lang = HTML_AND_MOMENT_LANG
  podcastsMap.header.url = WWW_BASE
  podcastsMap.header.contact = CONTACT
  podcastsMap.header.gaId = GA_ID
  podcastsMap.header.podcasts = Object.keys(podcastsMap.podcasts).map(
    podcastKey => {
      const { name, description, episodes, podcastPath } = podcastsMap.podcasts[
        podcastKey
      ]
      let keptEpisodes =
        episodes.length > MAX_EPISODES_MENU
          ? episodes.slice(0, MAX_EPISODES_MENU)
          : episodes
      keptEpisodes = [
        { title: 'Tous les épisodes', episodePath: podcastPath }
      ].concat(
        keptEpisodes
        /* .map(kE => {
          const { title, episodePath, friendlyDate } = kE
          return { title, episodePath, friendlyDate }
        })
        */
      )

      return {
        name,
        title: name,
        description,
        podcastPath,
        episodes: keptEpisodes
      }
    }
  )

  return podcastsMap
}
