const fs = require("fs-extra");
const superagent = require("superagent");

const { TMP_PATH } = process.env;

function downloadFromUrl(url, fileName) {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(`${TMP_PATH}/${fileName}`);
    stream.on("finish", () => resolve(stream.path));
    stream.on("error", reject);

    superagent.get(url).pipe(stream);
  });
}

module.exports = {
  downloadFromUrl
};
