require('dotenv').config()

let gm ; 

if (process.env.USE_BUILT_GM) {
  gm = require('gm').subClass({
    imageMagick: true,
     appPath: require('path').join(__dirname, '/')
     })
} else {
  gm = require('gm')
}

let imgPathSource = require('path').join(__dirname, '/', 'logo-desondes-vocast-1400.png')
let imgTextColor = '#f1f1f1'
let fontPath = require('path').join(__dirname, '/', 'Montserrat-ExtraBold.ttf')
let imgTextFontSize = '54'
let imgText1W = '120'
let imgText1H = '680'
let imgText2H = 780
let imgText2W = 120
let subtitle1 = 'Premium'
let subtitle2 = ''
let imgPathFinal = '/home/anthony/vocast-www/add-episode/img/final.png'

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



/* OLD ********

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs-extra')
const os = require('os')

const TMP_PATH = os.tmpdir()
ffmpeg.setFfmpegPath(ffmpegPath)

ffmpeg('/home/anthony/audio.mp3')
        .setStartTime(8)
        .setDuration(10)
        .output('/home/anthony/audio2.mp3')
        .on('end', () => {
          console.log('OK', TMP_PATH)
        })
        .on('error', err => {
          console.error('ffmpeg error::', err)
          reject(err)
        })
        .run()
*/