const fs = require('fs-extra')

module.exports = async podcastsMap => {
  await fs.outputJson('./podcastsMap.json', podcastsMap)
}
