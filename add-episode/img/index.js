const fs = require("fs-extra");
const gm = require("gm");
const path = require("path");

const { get } = require("lodash");

const { downloadFromUrl, uploadLocalFileToS3 } = require("../../utils");

const { TMP_PATH } = process.env;

module.exports = async (podcastsMap, episodeData) => {
  if (!episodeData.image) {
    const { podcast, title, number } = episodeData;
    const {
      imgTextColor,
      imgTextFont,
      imgTextFontSize,
      imgText1W,
      imgText1H,
      imgText2W,
      imgText2H,
      squareImg
    } = get(podcastsMap, ["podcasts", podcast]);

    const imgFilename = `${title}.png`;
    const imgPathSource = await downloadFromUrl(squareImg, imgFilename);
    const imgPathFinal = `${TMP_PATH}/${imgFilename}`;

    await new Promise(resolve => {
      gm(imgPathSource)
        .fill(imgTextColor)
        .font(
          `${path.resolve(__dirname, "fonts")}/${imgTextFont}`,
          imgTextFontSize
        )
        .drawText(imgText1W, imgText1H, title)
        .drawText(imgText2W, imgText2H, number)
        .write(imgPathFinal, function(err) {
          if (err) reject(err);
          resolve();
        });
    });

    episodeData.image = await uploadLocalFileToS3(
      imgPathFinal,
      `${podcast}/${imgName}`
    );

    await Prmise.all[(fs.remove(imgPathSource), fs.remove(imgPathFinal))];
  }

  console.log(episodeData);

  return { podcastsMap, episodeData };
};
