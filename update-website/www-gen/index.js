const { cloneDeep } = require('lodash')
const fs = require('fs-extra')
const merge = require('deepmerge')
const nunjucks = require('nunjucks')
const path = require('path')
var promiseLimit = require('promise-limit')

const { WWW_BASE, PODCAST_GEN_LIMIT } = process.env

const filePath = suffix => path.resolve(__dirname, suffix)

const baseAssetsFolder = filePath('assets_base')
const templatesFolder = filePath('templates')
const wwwFinalFolder = filePath('www-final')
const assetsFolder = `assets`
const wwwFinalAssetsFolder = `${wwwFinalFolder}/${assetsFolder}`

const podcastsMapUpdate = (inputPodcastsMap, updates) => {
  return merge(inputPodcastsMap, updates)
}

const assetsHandler = () => {
  fs.ensureDirSync(`${wwwFinalFolder}`)
  return fs
    .remove(wwwFinalAssetsFolder)
    .then(() => fs.copy(baseAssetsFolder, wwwFinalAssetsFolder))
    .catch(e => {
      console.error('Error with assets Fs operations', e)
    })
}

const generateHtml = (templatePath, dataObj, outputPath) => {
  try {
    nunjucks.configure(templatesFolder)
    const htmlData = nunjucks.render(templatePath, dataObj)
    return fs.writeFile(`${wwwFinalFolder}/${outputPath}`, htmlData)
  } catch (e) {
    console.error(
      `HTML Generation Error template ${templatePath}, output ${outputPath}`,
      e
    )
  }
}

const generate404HTML = async podcastsMap => {
  return generateHtml(`404.html`, podcastsMap, '404.html')
}
const generateAboutHTML = async podcastsMap => {
  return generateHtml(`about-us.html`, podcastsMap, 'about-us.html')
}

const generateContactHTML = async podcastsMap => {
  return generateHtml(`contact.html`, podcastsMap, 'contact.html')
}

const generateIndexHTML = async podcastsMap => {
  return generateHtml(`index.html`, podcastsMap, 'index.html')
}

const generatePodcastsPages = async podcastsMap => {
  const limit = promiseLimit(PODCAST_GEN_LIMIT)
  const promises = []
  const podcasts = podcastsMap['podcasts']

  const generatePodcastPageHTML = async (podcastsMap, episodePath) => {
    return generateHtml(`podcast.html`, podcastsMap, episodePath)
  }

  const generatePodcastsIndexHTML = async (podcastsMap, podcastPath) => {
    return generateHtml(
      `podcasts.html`,
      podcastsMap,
      `${podcastPath}/index.html`
    )
  }

  Object.keys(podcasts).forEach(podcastKey => {
    const podcastInfos = podcasts[podcastKey]
    const { podcastPath, title, description, episodes, image } = podcastInfos
    const [lastEpisode, ...othersEpisodes] = episodes

    const podcastsMapPodcast = podcastsMapUpdate(podcastsMap, {
      header: {
        title: title,
        description: description,
        url: `${WWW_BASE}/${podcastPath}`,
        image: image
      },
      lastEpisode,
      othersEpisodes,
      podcast: podcastInfos
    })

    // check if podcast folder exists, if not create directory
    fs.ensureDirSync(`${wwwFinalFolder}/${podcastPath}`)

    promises.push(
      limit(() => generatePodcastsIndexHTML(podcastsMapPodcast, podcastPath))
    )
    episodes.forEach(episodeInfos => {
      const { episodePath, title, description } = episodeInfos
      const podcastMapEpisode = podcastsMapUpdate(podcastsMapPodcast, {
        header: {
          title: title,
          description: description,
          url: `${WWW_BASE}/${episodePath}`
        },
        episode: episodeInfos
      })
      promises.push(
        limit(() => generatePodcastPageHTML(podcastMapEpisode, episodePath))
      )
    })
  })

  return Promise.all(promises).catch(e =>
    console.error('HTML Podcasts Generation error : ', e)
  )
}

module.exports = podcastsMap => {
  // console.log(podcastsMap.header)
  return Promise.all([
    assetsHandler(),
    generate404HTML(cloneDeep(podcastsMap)),
    generateAboutHTML(cloneDeep(podcastsMap)),
    generateContactHTML(cloneDeep(podcastsMap)),
    generateIndexHTML(cloneDeep(podcastsMap)),
    generatePodcastsPages(cloneDeep(podcastsMap))
  ]).then(() => console.log('Website generated'))
}
