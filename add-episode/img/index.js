const fs = require("fs-extra");
const gm = require("gm");
const { get } = require("lodash");

const { uploadLocalFileToS3 } = require("../../utils");
// https://github.com/Automattic/node-canvas
module.exports = async (podcastsMap, episodeData) => {
  if (!episodeData.image) {
    const { podcast, title } = episodeData;
    const { squareImg } = get(podcastsMap, ["podcasts", podcast]);

    const imgName = "logo-vocast-1400 (copie).png"; // `${title}.png`;
    const imgPath = `./${imgName}`;

    await new Promise(resolve => {
      gm(imgPath)
        .fill("#f1f1f1")
        .font("/home/anthony/Téléchargements/Montserrat-ExtraBold.ttf", 72)
        .drawText(120, 680, "Innovation")
        .drawText(120, 780, "#007")
        .write(imgPath + "2", function(err) {
          if (err) return console.dir(arguments);
          resolve();
        });
    });

    episodeData.image = await uploadLocalFileToS3(
      imgPath,
      `${podcast}/${imgName}`
    );
    fs.removeSync(imgPath);
  }

  console.log(episodeData);
  return { podcastsMap, episodeData };
};
