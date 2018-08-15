const fs = require("fs-extra");
const gm = require("gm");
const os = require("os");
const path = require("path");

const { get } = require("lodash");

const { downloadFromUrl, uploadLocalFileToS3 } = require("../../utils");

const TMP_PATH = os.tmpdir();

async function generateAndUploadImg({
  slug,
  number,
  title,
  subtitle1,
  subtitle2,
  imgPathSource,
  imgTextColor,
  fontPath,
  imgTextFontSize,
  imgText1W,
  imgText1H,
  imgText2W,
  imgText2H
}) {
  const imgFilename = `${subtitle1}.png`;
  const imgPathFinal = `${TMP_PATH}/${imgFilename}`;

  await new Promise((resolve, reject) => {
    gm(imgPathSource)
      .fill(imgTextColor)
      .font(fontPath, imgTextFontSize)
      .drawText(imgText1W, imgText1H, subtitle1)
      .drawText(imgText2W, imgText2H, subtitle2)
      .write(imgPathFinal, function(err) {
        if (err) reject(err);
        resolve();
      });
  });

  const imgFinalUrl = await uploadLocalFileToS3(
    imgPathFinal,
    `${slug}/${number}/${imgFilename}`
  );
  fs.removeSync(imgPathFinal);
  return imgFinalUrl;
}

module.exports = async ({ podcast, episode }) => {
  if (!episode.image) {
    const {
      title,
      subtitle,
      number,
      season,
      episode: episodeNumber,
      chapters
    } = episode;
    const {
      imgTextColor,
      imgTextFont,
      imgTextFontSize,
      imgText1W,
      imgText1H,
      imgText2W,
      imgText2H,
      slug,
      squareImg
    } = podcast;

    const imgFilename = `${title}.png`;
    const imgPathSource = await downloadFromUrl(squareImg, imgFilename);
    const fontPath = await downloadFromUrl(imgTextFont, `${title}-font`);

    const processDataObj = {
      title,
      subtitle1: subtitle,
      subtitle2: `S${season}E${episodeNumber}`,
      slug,
      number,
      imgPathSource,
      imgTextColor,
      fontPath,
      imgTextFontSize,
      imgText1W,
      imgText1H,
      imgText2W,
      imgText2H
    };

    episode.image = await generateAndUploadImg(processDataObj);

    for (let i = 0; i < chapters.length; i++) {
      try {
        const { section } = chapters[i];
        episode.chapters[i].image = await generateAndUploadImg(
          Object.assign({}, processDataObj, {
            title: section,
            subtitle1: section
          })
        );
      } catch (e) {
        console.error("cannot process img chapter ", e);
      }
    }

    await Promise.all[(fs.remove(fontPath), fs.remove(imgPathSource))];
  }

  return { podcast, episode };
};
