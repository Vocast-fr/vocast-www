async function main() {
  try {
    require("dotenv").config();
    const debug = require("debug")("vocast-tools/build-website");
    const util = require("util");
    const podcastsMapFulfiller = require("./podcastsMap-fulfiller");
    const wwwGenerator = require("./www-gen");
    const ftpPublish = require("./ftp-publish");

    debug("Start!");

    podcastsMapFulfiller()
      .then(wwwGenerator)
      .then(wwwFinalFolder => {
        if (process.env.DEV) {
          while (true) {}
        }
        return wwwFinalFolder;
      })
      .then(ftpPublish)
      .then(() => {
        debug("Ended with success");
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
