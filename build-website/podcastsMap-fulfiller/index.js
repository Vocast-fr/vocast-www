const moment = require("moment");

const { dateSort, getFromDb, putDb } = require("../../utils");

module.exports = async () => {
  const {
    DB_EPISODES,
    DB_PODCASTS,
    DB_SITES,
    MAX_EPISODES_MENU,
    SITE_SLUG
  } = process.env;

  const [site] = await getFromDb(DB_SITES, { slug: SITE_SLUG });
  const podcasts = await getFromDb(DB_PODCASTS);

  for (let podcast of podcasts) {
    try {
      const { slug } = podcast;
      const episodes = await getFromDb(DB_EPISODES, {
        podcast: slug,
        readyForPub: true
      });
      Object.assign(podcast, { episodes });
    } catch (e) {
      console.error("Error getting episodes for podcast", podcast);
    }
  }

  site.podcasts = {};
  podcasts.forEach(({ slug }, i) => {
    site.podcasts[slug] = podcasts[i];
  });
  podcastsMap = site;

  moment.locale(podcastsMap.lang._); // default the locale

  /***********************************
   ** podcastsMap.podcasts fulfill ***
   ***********************************/

  Object.keys(podcastsMap.podcasts).forEach(podcastKey => {
    const podcastPath = podcastKey;
    podcastsMap.podcasts[podcastKey].podcastPath = podcastPath;

    const episodes = podcastsMap.podcasts[podcastKey].episodes;
    podcastsMap.podcasts[podcastKey].episodes = episodes
      .map(e =>
        Object.assign(
          {
            friendlyDate: moment(e.date).format("LL"),
            episodePath: `${podcastPath}/s${e.season}e${e.episode}.html`
          },
          e
        )
      )
      .sort((a, b) => dateSort(a.date, b.date, false));
  });

  /***********************************
   ******* FOOTER & HEADER ***********
   ***********************************/

  if (!podcastsMap.footer) podcastsMap.footer = {};
  podcastsMap.footer.year = moment().year();

  podcastsMap.header.podcasts = Object.keys(podcastsMap.podcasts).map(
    podcastKey => {
      const {
        title,
        description,
        episodes,
        podcastPath
      } = podcastsMap.podcasts[podcastKey];
      let keptEpisodes =
        episodes.length > MAX_EPISODES_MENU
          ? episodes.slice(0, MAX_EPISODES_MENU)
          : episodes;
      keptEpisodes = [
        { title: "Tous les épisodes", episodePath: podcastPath }
      ].concat(
        keptEpisodes
        /* .map(kE => {
          const { title, episodePath, friendlyDate } = kE
          return { title, episodePath, friendlyDate }
        })
        */
      );

      return {
        title,
        description,
        podcastPath,
        episodes: keptEpisodes
      };
    }
  );

  return podcastsMap;
};
