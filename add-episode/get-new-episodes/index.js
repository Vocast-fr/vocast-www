const { getFromDb } = require("../../utils");

module.exports = async () => {
  const { DB_EPISODES, DB_PODCASTS } = process.env;

  let newEpisodes = await getFromDb(DB_EPISODES, { auphonic_uuid: null });

  return Promise.all(
    newEpisodes.map(async newEpisode => {
      const { podcast: podcastSlug } = newEpisode;
      const [podcast] = await getFromDb(DB_PODCASTS, { slug: podcastSlug });
      return { episode: newEpisode, podcast };
    })
  );
};
