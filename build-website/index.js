async function main() {
  try {
    require("dotenv").config();
    const util = require("util");
    const podcastsMapFulfiller = require("./podcastsMap-fulfiller");
    const wwwGenerator = require("./www-gen");

    console.log("MAIN build-site: Start!");

    podcastsMapFulfiller()
      .then(wwwGenerator)
      .then(podcastsMap => {
        if (process.env.DEV) {
          while (true) {}
        }
        console.log(
          "MAIN build-site: Process ended."
          //   util.inspect(podcastsMap, { showHidden: false, depth: null })
        );
      })
      .catch(e => {
        console.error("EXECUTION build-site error", e);
      });
  } catch (e) {
    console.error("MAIN build-site: Error ", e);
  }
}

main().catch(e => {
  console.error("GLOBAL: Error", e);
});
