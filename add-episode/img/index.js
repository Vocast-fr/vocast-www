const fs = require('fs-extra')
const gm = require('gm')
const os = require('os')

const { downloadFromUrl, uploadLocalFileToS3 } = require('../../utils')

const TMP_PATH = os.tmpdir()

async function generateAndUploadImg ({
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
  const imgFilename = `${subtitle1}.png`
  const imgPathFinal = `${TMP_PATH}/${imgFilename}`

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

  const imgFinalUrl = await uploadLocalFileToS3(
    imgPathFinal,
    `${slug}/${number}/${imgFilename}`
  )
  fs.removeSync(imgPathFinal)
  return imgFinalUrl
}

module.exports = async ({ podcast, episode }) => {
  // if (!episode.image) {
  const {
    title,
    subtitle,
    number,
    season,
    episode: episodeNumber,
    chapters
  } = episode
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
  } = podcast

  const debug = require('debug')(`vocast-tools/img/${slug}/${title}`)

  debug('Downloading img & font...')
  const imgPathSource = await downloadFromUrl(squareImg, `${title}-base`)
  debug('Image downloaded.')
  const fontPath = await downloadFromUrl(imgTextFont, `${title}-font`)
  debug('Font downloaded.')

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
  }

  debug('Generating image for episode...')
  episode.image = await generateAndUploadImg(processDataObj)
  debug('Image for episode generated.')

  debug('Generating images for chapters...')
  for (let i = 0; i < chapters.length; i++) {
    try {
      const { section } = chapters[i]
      episode.chapters[i].image = await generateAndUploadImg(
        Object.assign({}, processDataObj, {
          title: section,
          subtitle1: section
        })
      )
    } catch (e) {
      console.error(`img/${slug}/${title}:: cannot process img chapter `, e)
    }
  }

  await Promise.all[(fs.remove(fontPath), fs.remove(imgPathSource))]

  /*
  } else {
   console.log(`Episode ${episode.title} already has an image`)

    // @TODO Handle input img ...

  }
*/
  return { podcast, episode }
}
