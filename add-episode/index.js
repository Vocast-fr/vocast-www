async function main() {
  try {
    require("dotenv").config();

    const debug = require("debug")("vocast-tools/add-episode");
    const getNewEpisodes = require("./get-new-episodes");
    const imgProcess = require("./img");
    const auphonicProcess = require("./auphonic");

    debug("Start!");

    getNewEpisodes()
      .then(data => Promise.all(data.map(imgProcess)))
      .then(data => Promise.all(data.map(auphonicProcess)))
      .then(res => {
        debug("Process ended.");
      })
      .catch(e => {
        console.error("EXECUTION add-episode error", e);
      });
  } catch (e) {
    console.error("MAIN add-episode: Error ", e);
  }
}

main().catch(e => {
  console.error("GLOBAL: Error", e);
});
