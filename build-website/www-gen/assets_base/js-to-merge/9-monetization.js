let total = 0
let scale
let currency

function formatAmount(amount) {
  return (amount * Math.pow(10, -scale)).toFixed(scale)
}

if (document.monetization) {
  document.monetization.addEventListener('monetizationprogress', (ev) => {
    // initialize currency and scale on first progress event
    if (total === 0) {
      scale = ev.detail.assetScale
      currency = ev.detail.assetCode
    }

    const actualAmount = Number(ev.detail.amount)
    total += actualAmount

    const actualFormatted = formatAmount(actualAmount)
    const totalFormatted = formatAmount(total)

    const pickedPointer = ev.detail.paymentPointer

    console.log(
      `Monetization : sent ${actualFormatted} ${currency} to ${pickedPointer}.`
    )
    console.log(`Total sent for this session : ${totalFormatted}`)
  })
} else {
  console.log('Monetization : Not activated')
}
