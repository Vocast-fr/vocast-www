const gm = require('gm').subClass({
  imageMagick: true,
  appPath: require('path').join(__dirname, '/')
})

let imgPathSource =
  '/home/anthony/Téléchargements/dov/logo-desondes-vocast-1400.png'
let imgTextColor = '#f1f1f1'
let fontPath = '/home/anthony/Téléchargements/dov/Montserrat-ExtraBold.ttf'
let imgTextFontSize = '54'
let imgText1W = '120'
let imgText1H = '680'
let imgText2H = 780
let imgText2W = 120
let subtitle1 = 'Premium'
let subtitle2 = ''
let imgPathFinal = '/home/anthony/Téléchargements/dov/final.png'

async function generateImg() {
  await new Promise((resolve, reject) => {
    gm(imgPathSource)
      .fill(imgTextColor)
      .font(fontPath, imgTextFontSize)
      .drawText(imgText1W, imgText1H, subtitle1)
      .drawText(imgText2W, imgText2H, subtitle2)
      .write(imgPathFinal, function(err) {
        if (err) reject(err)
        resolve()
      })
  })
}

generateImg()
  .then(() => console.log('done'))
  .catch(console.error)
