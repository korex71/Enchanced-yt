const $ = (selector) =>
  typeof selector === "string" ? document.querySelector(selector) : selector;

const $click = (selector) =>
  typeof selector === "string"
    ? document.querySelector(selector).click()
    : selector.click();

(() => {
  const timeout = setInterval(() => {
    // First try skip click
    const skipAdBtn = $("button.ytp-ad-skip-button");
    const skipAdBtn = $("button.ytp-ad-skip-button"); // Ad Btn
    const AdBanner = $(".ytp-ad-image-overlay"); // Remove ad banner
    const AdBannerTwo = $("button.ytp-ad-overlay-close-button");

    if (AdBanner) AdBanner.style.display = "none";
    if (skipAdBtn) $click(skipAdBtn);
    if (AdBannerTwo) $click(AdBannerTwo);

    // Force skip ad if exists.
    const videoAd = $(".ad-showing video");

    if (videoAd) {
      if (videoAd.currentTime === videoAd.duration) {
        let skipAd = $("button.ytp-ad-skip-button"); // Click on "skip"
        $click(skipAd);
      }

      videoAd.currentTime = videoAd.duration; // Skip to end

      let skipAd = $("button.ytp-ad-skip-button"); // Click on "skip"

      if (skipAd) $click(skipAd);
    }
  }, 100);

  return function () {
    clearTimeout(timeout);
  };
})();
