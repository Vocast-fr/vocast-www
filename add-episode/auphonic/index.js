const fileExtension = require("file-extension");
const fs = require("fs-extra");
const htmlToText = require("html-to-text");
const { get, cloneDeep } = require("lodash");
const moment = require("moment");
const request = require("superagent");

const chaptering = require("./chaptering");
const { downloadFromUrl, putDb, sleep } = require("../../utils");

const { AUPHONIC_USER, AUPHONIC_PWD, DB_EPISODES } = process.env;

function authAuphonicRequest(method, endUri) {
  return request[method](`https://auphonic.com/api/${endUri}`).auth(
    AUPHONIC_USER,
    AUPHONIC_PWD
  );
}

function postProduction(data) {
  return authAuphonicRequest("post", "productions.json")
    .set("Content-Type", "application/json")
    .send(data);
}

function postProductionLocalFile(uuid, filePath) {
  return authAuphonicRequest("post", `production/${uuid}/upload.json`).attach(
    "input_file",
    filePath
  );
}

function startProduction(uuid) {
  return authAuphonicRequest("post", `production/${uuid}/start.json`);
}

function getProduction(uuid) {
  return authAuphonicRequest("get", `production/${uuid}.json`);
}

function getProductionUntilDone(uuid) {
  return getProduction(uuid).then(async res => {
    const status = get(res, ["body", "data", "status_string"]);
    if (status === "Done") {
      return res.body.data;
    } else {
      await sleep(5000);
      return getProductionUntilDone(uuid);
    }
  });
}

async function updateEpisodeInDbFromAuphonicResult({
  podcast,
  episode,
  auphonicResult
}) {
  const { podcastService, audioUrlPrefix } = podcast;
  const { outgoing_services, length } = auphonicResult;

  const fromOutGoingServicesToUrl = service => {
    const ogResults = outgoing_services.find(({ type }) => type === service);

    const url =
      ogResults.result_urls &&
      ogResults.result_urls.length > 0 &&
      !!ogResults.result_urls[0]
        ? ogResults.result_urls[0]
        : ogResults.result_page;

    return url.replace("http://", "https://");
  };

  const audioUrl = fromOutGoingServicesToUrl(podcastService);
  const youtubeUrl = fromOutGoingServicesToUrl("youtube");

  Object.assign(episode, {
    audioUrl: `${audioUrlPrefix}${audioUrl}`,
    youtubeUrl,
    squareImg: episode.image,
    durationMin: Math.ceil(length / 60),
    readyForPub: true
  });

  await putDb(DB_EPISODES, episode);
}

function getChapterSummary(description, chapter) {
  const chapterDescription = cloneDeep(chapter.description);
  const episodeDescription = cloneDeep(description);
  episodeDescription.splice(1, 0, ...chapterDescription);
  return episodeDescription;
}

function getEpisodeSummary(description, chapters) {
  const episodeDescription = cloneDeep(description);
  for (let i = chapters.length - 1; i >= 0; i--) {
    const chapter = chapters[i];
    if (chapter.description.length) {
      episodeDescription.splice(1, 0, chapter.description.join("<br/>"));
    }
  }
  return episodeDescription;
}

function htmlTransform(htmlArray) {
  return htmlToText.fromString(
    htmlArray.map(p => "<p>" + p + "</p>").join(""),
    { wordwrap: null }
  );
}

module.exports = async ({ podcast, episode }) => {
  const {
    input_file,
    image,
    title,
    subtitle,
    description,
    date,
    tags,
    location,
    chapters,
    number
  } = episode;

  const { slug, preset, preset_clips } = podcast;
  const year = date.split("-")[0];

  const debug = require("debug")(`vocast-tools/auphonic/${slug}/${title}`);

  if (typeof preset === "undefined" || typeof preset_clips === "undefined") {
    throw new Error(
      `No preset for episode ! Podcast ${podcast}:  ${preset} / ${preset_clips}`
    );
  }

  debug(`Downloading input file...`);
  const tmpCompleteFilePath = await downloadFromUrl(input_file, title);
  const tmpCompleteFileExt = fileExtension(tmpCompleteFilePath);
  debug(
    `Input file downloaded, file can be found here : ${tmpCompleteFilePath}`
  );

  debug(`Now have to process ${chapters.length} chapters`);

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    try {
      const { visible, start, end, title: chapterTitle, section } = chapter;

      if (visible) {
        const summary = htmlTransform(getChapterSummary(description, chapter));
        chapter.durationSec =
          moment.duration(end).asSeconds() - moment.duration(start).asSeconds();
        chapter.startSec = moment.duration(start).asSeconds();

        chapter.input_file = await chaptering(chapter, {
          tmpCompleteFilePath,
          tmpCompleteFileExt,
          s3Folder: `${slug}/${number}`
        });

        const data = {
          image: chapter.image,
          input_file: chapter.input_file,
          preset: preset_clips,
          output_basename: chapterTitle,
          metadata: {
            title: chapterTitle,
            //  subtitle,
            summary,
            year,
            tags: [`${slug}part`, section],
            location
          }
        };

        debug(
          `${chapterTitle}:: Ready to request Auphonic API --> POST /production.json...`
        );
        const auphonicChapterRes = await postProduction(data);
        const uuid = get(auphonicChapterRes, "body.data.uuid");
        debug(
          `${chapterTitle}:: POST /production.json Auphonic uuid: ${uuid}. Now starting Auphonic process...`
        );
        await startProduction(uuid);
        debug(`${chapterTitle}:: Auphonic proess done.`);
      } else {
        debug(`Chapter ${i} should not be processed (visible = false)`);
      }
    } catch (e) {
      console.error("chaptering error :: ", e);
    }
    chapters[i] = chapter;
  }

  fs.removeSync(tmpCompleteFilePath);

  debug("Now Auphonic process for the entire episode");

  const data = {
    image,
    input_file,
    preset,
    output_basename: title,
    metadata: {
      title,
      subtitle,
      summary: htmlTransform(getEpisodeSummary(description, chapters)),
      year,
      tags: [`${slug}complete`].concat(tags),
      location
    },
    chapters
  };

  const auphonicEpisodeRes = await postProduction(data);
  episode.auphonic_uuid = get(auphonicEpisodeRes, "body.data.uuid");
  debug(
    `UUID Auphonic process for the entire episode : ${episode.auphonic_uuid}`
  );
  await startProduction(episode.auphonic_uuid);
  debug(`Auphonic process started waiting it's done (can be very long)...`);
  const auphonicResult = await getProductionUntilDone(episode.auphonic_uuid);

  debug("Auphonic's process is finished! Now ready to update db...");
  await updateEpisodeInDbFromAuphonicResult({
    podcast,
    episode,
    auphonicResult
  });
  debug("Episode updated in db");
};
