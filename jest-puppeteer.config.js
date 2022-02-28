module.exports = {
    launch: {
        headless: false,
        slowMo: 50
    },
    dumpio: true,
    product: "chrome",
    defaultViewport: {
      width: 320,
      height: 600,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    },
    browserContext: "default",
}
