const gm = require("gm");
const os = require("os");

let imgPathSource =
    "/home/anthony/Téléchargements/logo-desondes-vocast-1400.png",
  imgTextColor = "#f1f1f1",
  fontPath = "/home/anthony/Téléchargements/Montserrat-ExtraBold.ttf",
  imgTextFontSize = "54",
  imgText1W = "120",
  imgText1H = "680",
  imgText2H = 780,
  imgText2W = 120,
  subtitle1 = "Extraits",
  subtitle2 = "",
  imgPathFinal = "/home/anthony/Téléchargements/final.png";

async function generateImg() {
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
}

generateImg()
  .then(() => console.log("done"))
  .catch(console.error);
