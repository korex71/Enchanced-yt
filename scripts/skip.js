const $ = (selector) =>
  typeof selector === "string" ? document.querySelector(selector) : selector;

const $click = (selector) => {
  const element =
    typeof selector === "string" ? document.querySelector(selector) : selector;

  if (element) element.click();
};

const $css = (styles) => {
  let css = document.createElement("style");
  css.innerText = styles;
  document.head.appendChild(css);
};

window.onload = () => {
  let styles = ".ytp-ad-image-overlay { display: 'none'!important } ";
  styles +=
    ".ytp-ad-overlay-container, #player-ads { display: 'none'!important } ";

  $css(styles);
};

(() => {
  const timeout = setInterval(() => {
    $click("button.ytp-ad-overlay-close-button"); // Try close ad banner
    $click("button.ytp-ad-skip-button");

    // Force skip ad if exists.
    const videoAd = $(".ad-showing video");

    if (videoAd) {
      // Prevent non-finite value.
      if (isFinite(video.duration)) {
        videoAd.currentTime = videoAd.duration; // Skip to end
      }

      $click("button.ytp-ad-skip-button"); // Click on "skip"
    }
  }, 100);

  return function () {
    clearTimeout(timeout);
  };
})();
