const { cloneDeep } = require("lodash");
const fs = require("fs-extra");
const merge = require("deepmerge");
const nunjucks = require("nunjucks");
const os = require("os");
const path = require("path");
const promiseLimit = require("promise-limit");

module.exports = podcastsMap => {
  const debug = require("debug")("vocast-tools/www-gen");

  const {
    header: { url }
  } = podcastsMap;
  const TMP_PATH = os.tmpdir();

  const { PODCAST_GEN_LIMIT } = process.env;

  const filePath = suffix => path.resolve(__dirname, suffix);

  const baseAssetsFolder = filePath("assets_base");
  const templatesFolder = filePath("templates");
  const wwwFinalFolder = TMP_PATH + "/www-final";
  const assetsFolder = `assets`;
  const wwwFinalAssetsFolder = `${wwwFinalFolder}/${assetsFolder}`;

  const podcastsMapUpdate = (inputPodcastsMap, updates) => {
    return merge(inputPodcastsMap, updates);
  };

  const generateHtml = (templatePath, dataObj, outputPath, appendTitle) => {
    const finalObj = appendTitle
      ? podcastsMapUpdate(dataObj, {
          header: { title: `${dataObj.header.title} - ${appendTitle}` }
        })
      : dataObj;

    try {
      nunjucks.configure(templatesFolder, { autoescape: false });
      const htmlData = nunjucks.render(templatePath, finalObj);
      return fs.writeFile(`${wwwFinalFolder}/${outputPath}`, htmlData);
    } catch (e) {
      console.error(
        `HTML Generation Error template ${templatePath}, output ${outputPath}`,
        e
      );
    }
  };

  const generate404HTML = async podcastsMap => {
    return generateHtml(`error404.html`, podcastsMap, "error404.html", "404");
  };
  const generateAboutHTML = async podcastsMap => {
    return generateHtml(
      `about-us.html`,
      podcastsMap,
      "about-us.html",
      podcastsMap.lang.team
    );
  };
  const generateContactHTML = async podcastsMap => {
    return generateHtml(
      `contact.html`,
      podcastsMap,
      "contact.html",
      podcastsMap.lang.contact
    );
  };
  const generateIndexHTML = async podcastsMap => {
    return generateHtml(
      `index.html`,
      podcastsMap,
      "index.html",
      podcastsMap.lang.welcome
    );
  };

  const generateTermsHTML = async podcastsMap => {
    return generateHtml(
      `terms.html`,
      podcastsMap,
      "terms.html",
      podcastsMap.lang.terms
    );
  };

  const generatePodcastsPages = async podcastsMap => {
    const limit = promiseLimit(PODCAST_GEN_LIMIT);
    const promises = [];
    const podcasts = podcastsMap["podcasts"];

    const generatePodcastPageHTML = async (podcastsMap, episodePath) => {
      return generateHtml(`podcast.html`, podcastsMap, episodePath);
    };

    const generatePodcastsIndexHTML = async (podcastsMap, podcastPath) => {
      return generateHtml(
        `podcasts.html`,
        podcastsMap,
        `${podcastPath}/index.html`
      );
    };

    Object.keys(podcasts).forEach(podcastKey => {
      const podcastInfos = podcasts[podcastKey];
      const {
        podcastPath,
        title,
        description,
        episodes,
        image,
        rss,
        iTunesAppId,
        applePodcastsLink,
        googlePodcastsLink,
        social
      } = podcastInfos;
      const [lastEpisode, ...othersEpisodes] = episodes;

      const podcastsMapPodcast = podcastsMapUpdate(podcastsMap, {
        header: {
          title: `${podcastsMap.header.title} - ${title}`,
          description: description,
          url: `${url}/${podcastPath}`,
          image: image,
          rss,
          iTunesAppId,
          applePodcastsLink,
          googlePodcastsLink,
          social,
          isPodcastHomepage: true
        },
        lastEpisode,
        othersEpisodes,
        podcast: podcastInfos
      });

      // check if podcast folder exists, if not create directory
      fs.ensureDirSync(`${wwwFinalFolder}/${podcastPath}`);

      promises.push(
        limit(() => generatePodcastsIndexHTML(podcastsMapPodcast, podcastPath))
      );
      episodes.forEach((episodeInfos, episodeIndex) => {
        const { episodePath, title, description } = episodeInfos;
        const podcastMapEpisode = podcastsMapUpdate(podcastsMapPodcast, {
          header: {
            title: `${podcastsMap.header.title} - ${title}`,
            description: description,
            url: `${url}/${episodePath}`,
            isPodcastHomepage: false,
            shouldBeAmp: true
          },
          episode: episodeInfos,
          previousEpisode:
            episodeIndex === 0 ? undefined : episodes[episodeIndex - 1],
          nextEpisode:
            episodeIndex < episodes.length - 1
              ? episodes[episodeIndex + 1]
              : undefined
        });
        promises.push(
          limit(() => generatePodcastPageHTML(podcastMapEpisode, episodePath))
        );
      });
    });

    return Promise.all(promises).catch(e =>
      console.error("HTML Podcasts Generation error : ", e)
    );
  };

  /* ***** Main exec ***********/

  const copyTerms = fs.copy(
    filePath("../../terms.html"),
    `${templatesFolder}/terms_base.html`
  );

  const prepareWwwFinal = fs
    .remove(wwwFinalFolder)
    .then(() => fs.ensureDir(wwwFinalFolder))
    .then(() => fs.copy(baseAssetsFolder, wwwFinalAssetsFolder));

  return Promise.all([copyTerms, prepareWwwFinal])
    .then(() =>
      Promise.all([
        generate404HTML(cloneDeep(podcastsMap)),
        generateAboutHTML(cloneDeep(podcastsMap)),
        generateContactHTML(cloneDeep(podcastsMap)),
        generateIndexHTML(cloneDeep(podcastsMap)),
        generateTermsHTML(cloneDeep(podcastsMap)),
        generatePodcastsPages(cloneDeep(podcastsMap))
      ])
    )
    .then(() => {
      debug(`Webpages successfully generated to ${wwwFinalFolder}`);
      return wwwFinalFolder;
    });
};
