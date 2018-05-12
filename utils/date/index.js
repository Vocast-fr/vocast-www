const moment = require('moment')

function dateSort (a, b, asc = true) {
  const aMoment = moment(a)
  const bMoment = moment(b)
  if (aMoment.isBefore(bMoment)) return asc ? -1 : 1
  if (aMoment.isAfter(bMoment)) return asc ? 1 : -1
  return 0
}

module.exports = {
  dateSort
}
