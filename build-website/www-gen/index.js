const { cloneDeep } = require('lodash')
const fs = require('fs-extra')
const merge = require('deepmerge')
const htmlToText = require('html-to-text')
const moment = require('moment')
const nunjucks = require('nunjucks')
const os = require('os')
const path = require('path')
const promiseLimit = require('promise-limit')
const sm = require('sitemap')

module.exports = podcastsMap => {
  const debug = require('debug')('vocast-tools/www-gen')

  const {
    header: { url }
  } = podcastsMap
  const TMP_PATH = os.tmpdir()

  const { PODCAST_GEN_LIMIT } = process.env

  const filePath = suffix => path.resolve(__dirname, suffix)

  const baseAssetsFolder = filePath('assets_base')
  const templatesFolder = filePath('templates')
  const wwwFinalFolder = TMP_PATH + '/www-final'
  const assetsFolder = 'assets'
  const wwwFinalAssetsFolder = `${wwwFinalFolder}/${assetsFolder}`

  const sitemap = sm.createSitemap({
    hostname: url
  })

  const podcastsMapUpdate = (inputPodcastsMap, updates) => {
    return merge(inputPodcastsMap, updates)
  }

  const generateHtml = (templatePath, dataObj, outputPath, appendTitle) => {
    const finalObj = appendTitle
      ? podcastsMapUpdate(dataObj, {
        header: { title: `${appendTitle} - ${dataObj.header.title}` }
      })
      : dataObj

    try {
      nunjucks.configure(templatesFolder, { autoescape: false })
      const htmlData = nunjucks.render(templatePath, finalObj)
      return fs.writeFile(`${wwwFinalFolder}/${outputPath}`, htmlData)
    } catch (e) {
      console.error(
        `HTML Generation Error template ${templatePath}, output ${outputPath}`,
        e
      )
    }
  }

  const generate404HTML = async podcastsMap => {
    return generateHtml(
      '404.html',
      podcastsMapUpdate(podcastsMap, { header: { description: '' } }),
      '404.html',
      '404'
    )
  }

  const generateAboutHTML = async podcastsMap => {
    sitemap.add({ url: '/about-us.html', priority: 0.4 })

    return generateHtml(
      'about-us.html',
      podcastsMapUpdate(podcastsMap, {
        header: { description: podcastsMap.team.description }
      }),
      'about-us.html',
      podcastsMap.lang.team
    )
  }

  const generateContactHTML = async podcastsMap => {
    const { title, description } = podcastsMap.contact

    sitemap.add({ url: '/contact.html', priority: 0.5 })

    return generateHtml(
      'contact.html',
      podcastsMapUpdate(podcastsMap, {
        header: { description: `${title} ${description}` }
      }),
      'contact.html',
      podcastsMap.lang.contact
    )
  }

  const generateIndexHTML = async podcastsMap => {
    sitemap.add({ url: '/', priority: 1 })
    return generateHtml(
      'index.html',
      podcastsMap,
      'index.html',
      '' // podcastsMap.lang.welcome
    )
  }

  const generateTermsHTML = async podcastsMap => {
    return generateHtml(
      'terms.html',
      podcastsMapUpdate(podcastsMap, {
        header: { description: podcastsMap.lang.terms }
      }),
      'terms.html',
      podcastsMap.lang.terms
    )
  }

  const generatePodcastsPages = async podcastsMap => {
    const limit = promiseLimit(PODCAST_GEN_LIMIT)
    const promises = []
    const podcasts = podcastsMap.podcasts

    const generatePodcastPageHTML = async (podcastsMap, episodePath) => {
      sitemap.add({ url: `/${episodePath}`, priority: 0.8 })

      return generateHtml('podcast.html', podcastsMap, episodePath)
    }

    const generatePodcastsIndexHTML = async (podcastsMap, podcastPath) => {
      sitemap.add({ url: `/${podcastPath}/`, priority: 0.9 })
      return generateHtml(
        'podcasts.html',
        podcastsMap,
        `${podcastPath}/index.html`
      )
    }

    const generatePodcastsListenHTML = async (podcastsMap, podcastPath) => {
      sitemap.add({ url: `/${podcastPath}/listen.html`, priority: 0.9 })
      return generateHtml(
        'listen.html',
        podcastsMap,
        `${podcastPath}/listen.html`
      )
    }

    Object.keys(podcasts).forEach(podcastKey => {
      const podcastInfos = podcasts[podcastKey]
      const {
        podcastPath,
        title,
        description,
        episodes,
        image,
        rss,
        iTunesAppId,
        applePodcastsLink,
        googlePodcastsLink,
        youtubeLink,
        mediumLink,
        social,
        subtitle
      } = podcastInfos
      const [lastEpisode, ...othersEpisodes] = episodes

      const podcastsMapPodcast = podcastsMapUpdate(podcastsMap, {
        header: {
          title: `${title} | ${subtitle}`,
          description: description,
          url: `${url}/${podcastPath}`,
          image: image,
          rss,
          iTunesAppId,
          applePodcastsLink,
          googlePodcastsLink,
          youtubeLink,
          mediumLink,
          social,
          isPodcastHomepage: true
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
      promises.push(
        limit(() => generatePodcastsListenHTML(podcastsMapPodcast, podcastPath))
      )
      episodes.forEach((episodeInfos, episodeIndex) => {
        const { title, description, image, date, episode, season, episodePath } = episodeInfos
        const podcastMapEpisode = podcastsMapUpdate(podcastsMapPodcast, {
          header: {
            title: `${title} | ${podcastsMap.lang.listen} podcast ${podcastsMapPodcast.podcast.title} S${season}E${episode} `,
            description: htmlToText.fromString(description[0], {
              wordwrap: false,
              ignoreHref: true
            }),
            image,
            date: moment(date).format(),
            url: `${url}/${episodePath}`,
            isPodcastHomepage: false,
            isEpisodePage: true
          },
          episode: episodeInfos,
          previousEpisode:
            episodeIndex === 0 ? undefined : episodes[episodeIndex - 1],
          nextEpisode:
            episodeIndex < episodes.length - 1
              ? episodes[episodeIndex + 1]
              : undefined
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

  /* ***** Main exec ***********/

  const copyTerms = fs.copy(
    filePath('../../terms.html'),
    `${templatesFolder}/terms_base.html`
  )

  const prepareWwwFinal = fs
    .remove(wwwFinalFolder)
    .then(() => fs.ensureDir(wwwFinalFolder))
    .then(() => fs.copy(baseAssetsFolder, wwwFinalAssetsFolder))

  return Promise.all([copyTerms, prepareWwwFinal])
    .then(() =>
      Promise.all([
        generate404HTML(cloneDeep(podcastsMap)),
        generateAboutHTML(cloneDeep(podcastsMap)),
        generateContactHTML(cloneDeep(podcastsMap)),
        generateIndexHTML(cloneDeep(podcastsMap)),
        generateTermsHTML(cloneDeep(podcastsMap)),
        generatePodcastsPages(cloneDeep(podcastsMap))
      ])
    )
    .then(() => {
      fs.writeFileSync(`${wwwFinalFolder}/sitemap.xml`, sitemap.toString())
      debug(`Webpages successfully generated to ${wwwFinalFolder}`)
      return wwwFinalFolder
    })
}
