let total = 0
let scale
let currency
const startSessionDate = new Date()

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

    const actualDate = new Date()
    const diffDateInSec =
      (actualDate.getTime() - startSessionDate.getTime()) / 1000

    console.log(
      `[$] ${actualDate.toLocaleTimeString()}\n`,
      `Sent ${actualFormatted} ${currency} to ${pickedPointer}\n`,
      `Total sent during ${diffDateInSec.toFixed()}s / ${(
        diffDateInSec / 60
      ).toFixed(1)}min / ${(diffDateInSec / 3600).toFixed(2)}h :\n`,
      `${totalFormatted} ${currency}`
    )
  })
} else {
  console.log('Monetization : Not activated')
}
