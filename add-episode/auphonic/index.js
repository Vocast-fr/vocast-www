const { get } = require("lodash");
const moment = require("moment");
const request = require("superagent");

const { sleep } = require("../../utils");

const { AUPHONIC_USER, AUPHONIC_PWD } = process.env;

const authAuphonicRequest = (method, endUri) =>
  request[method](`https://auphonic.com/api/${endUri}`).auth(
    AUPHONIC_USER,
    AUPHONIC_PWD
  );

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

module.exports = async (podcastsMap, inputData, isClip = false) => {
  const {
    input_file,
    podcast,
    title,
    description,
    paragraphs,
    date,
    tags,
    location,
    chapters
  } = inputData;

  const { preset, preset_clips } = get(podcastsMap, ["podcasts", podcast]);

  if (typeof preset === "undefined") {
    throw new Error(`No preset for episode  podcast ${podcast}`);
  }

  const summary = paragraphs.join("\n");
  const year = date.split("-")[0];

  const data = {
    input_file,
    preset: isClip ? preset_clips : preset,
    output_basename: title,
    metadata: {
      title,
      subtitle: description,
      summary,
      year,
      tags,
      location
    },
    chapters
  };

  let uuid;

  return postProduction(data, input_file)
    .then(function(res) {
      uuid = get(res, "body.data.uuid");
      return startProduction(uuid);
    })
    .then(() => {
      if (isClip) {
        return inputData;
      } else {
        return getProductionUntilDone(uuid).then(productionResult =>
          updatePodcastsMapFromNewProduction(
            podcastsMap,
            inputData,
            productionResult
          )
        );
      }
    });
};
