async function main() {
  try {
    require("dotenv").config();

    const getNewEpisodes = require("./get-new-episodes");
    const imgProcess = require("./img");
    const auphonicProcess = require("./auphonic");

    console.log("MAIN add-episode: Start!");

    getNewEpisodes()
      .then(data => Promise.all(data.map(imgProcess)))
      .then(data => Promise.all(data.map(auphonicProcess)))
      .then(res => {
        console.log("MAIN add-episode: Process ended.");
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
