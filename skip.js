const $ = (selector) =>
  typeof selector === "string" ? document.querySelector(selector) : selector;

const $click = (selector) => {
  if (typeof selector === "string") {
    if (document.querySelector(selector)) {
      return document.querySelector(selector).click();
    }
  }

  if (selector) {
    return selector.click();
  }
};

(() => {
  const timeout = setInterval(() => {
    // First try skip click
    const AdBanner = $(".ytp-ad-image-overlay"); // Remove ad banner

    if (AdBanner) AdBanner.style.display = "none";

    $click("button.ytp-ad-skip-button");
    $click("button.ytp-ad-overlay-close-button");

    // Force skip ad if exists.
    const videoAd = $(".ad-showing video");

    if (videoAd) {
      if (videoAd.currentTime === videoAd.duration) {
        $click("button.ytp-ad-skip-button"); // Click on "skip"
      }

      videoAd.currentTime = videoAd.duration; // Skip to end

      $click("button.ytp-ad-skip-button"); // Click on "skip"
    }
  }, 100);

  return function () {
    clearTimeout(timeout);
  };
})();
