let total = 0
let scale
let currency

if (document.monetization) {
  document.monetization.addEventListener('monetizationprogress', ev => {
    // initialize currency and scale on first progress event
    if (total === 0) {
      scale = ev.detail.assetScale
      currency = ev.detail.assetCode
    }

    total += Number(ev.detail.amount)

    const formatted = (total * Math.pow(10, -scale)).toFixed(scale)
    console.log('Monetization : ', formatted, ' ', currency)
  })
} else {
  console.log('Monetization : Not activated')
}
