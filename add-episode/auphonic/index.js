const { get, cloneDeep } = require("lodash");
const moment = require("moment");
const request = require("superagent");
const htmlToText = require("html-to-text");

const { sleep } = require("../../utils");

const { AUPHONIC_USER, AUPHONIC_PWD } = process.env;

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

function updatePodcastsMapFromNewProduction(
  podcastsMap,
  episodeData,
  productionData
) {
  const { podcast } = episodeData;

  episodeData.chapters = episodeData.chapters.map(c => {
    const { start } = c;
    const startSec = moment.duration(start).asSeconds();
    return Object.assign({ startSec }, c);
  });

  const { image, outgoing_services, length } = productionData;
  const awsResult = outgoing_services.find(({ type }) => type === "amazons3");
  const audioUrl = awsResult.result_urls[0].replace("http://", "https://");

  podcastsMap.podcasts[podcast].episodes.push(
    Object.assign(
      {
        audioUrl,
        squareImg: image,
        durationMin: Math.ceil(length / 60)
      },
      episodeData
    )
  );

  return podcastsMap;
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
    episodeDescription.splice(1, 0, chapter.description.join("<br/>"));
  }
  return episodeDescription;
}

function CDataSummary(summaryArray) {
  return `<![CDATA[
${summaryArray.map(p => "<p>" + p + "</p>")}
]]>`;
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
    chapters
  } = episode;

  const { slug, preset, preset_clips } = podcast;

  if (typeof preset === "undefined" || typeof preset_clips === "undefined") {
    throw new Error(
      `No preset for episode  podcast ${podcast}:  ${preset} / ${preset_clips}`
    );
  }

  const summary = htmlTransform(getEpisodeSummary(description, chapters));

  /*

  const summary = getEpisodeSummary(description, chapters).map(
    p => `
    ${p}
    `
  ); // CDataSummary(getEpisodeSummary(description, chapters));

  */

  const year = date.split("-")[0];

  const data = {
    image,
    input_file,
    preset,
    output_basename: title,
    metadata: {
      title,
      subtitle,
      summary,
      year,
      tags: [`${slug}complete`].concat(tags),
      location
    },
    chapters //: omit(cloneDeep(chapters), 'image'
  };

  let uuid;

  return postProduction(data, input_file)
    .then(function(res) {
      uuid = get(res, "body.data.uuid");
      return startProduction(uuid);
    })
    .then(() => getProductionUntilDone(uuid))
    .then(productionResult => {
      // durationSec = productionResult.format.length_sec

      // get audio file from spreaker api productionResult[type='spreaker'].result_urls[0]
      // add prefix : https://dts.podtrac.com...
      console.log("donnnne:: ", productionResult.outgoing_services);
    });

  /*
  for (let chapter of chapters) {
    const chapterSummary = CDataSummary(
      getChapterSummary(description, chapter)
    );
    console.log("*********************************************************");
    console.log("chapter ", chapterSummary);
    console.log("*********************************************************");
  }
  
*/
};
