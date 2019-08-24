const gm = require('gm')

let imgPathSource =
  '/home/anthony/Downloads/logo-desondes-vocast-1400.png'
let imgTextColor = '#f1f1f1'
let fontPath = '/home/anthony/Downloads/Montserrat-ExtraBold.ttf'
let imgTextFontSize = '54'
let imgText1W = '120'
let imgText1H = '680'
let imgText2H = 780
let imgText2W = 120
let subtitle1 = 'Premium'
let subtitle2 = ''
let imgPathFinal = '/home/anthony/Downloads/final.png'

async function generateImg () {
  await new Promise((resolve, reject) => {
    gm(imgPathSource)
      .fill(imgTextColor)
      .font(fontPath, imgTextFontSize)
      .drawText(imgText1W, imgText1H, subtitle1)
      .drawText(imgText2W, imgText2H, subtitle2)
      .write(imgPathFinal, function (err) {
        if (err) reject(err)
        resolve()
      })
  })
}

generateImg()
  .then(() => console.log('done'))
  .catch(console.error)
