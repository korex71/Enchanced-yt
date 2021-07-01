// function $(selector) {
//   this.element =
//     typeof selector === "string" ? document.querySelector(selector) : selector;

//   this.css = (style) => {
//     element.style.cssText = style;
//   };

//   this.click = () => this.element.click();

//   return element;
// }

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
  let styles = "";

  styles += ".ytp-ad-image-overlay { display: 'none'!important } ";
  styles +=
    ".ytp-ad-overlay-container, #player-ads { display: 'none'!important } ";

  $css(styles);
};

(() => {
  const timeout = setInterval(() => {
    $click("button.ytp-ad-skip-button"); // Try skip click
    $click("button.ytp-ad-overlay-close-button"); // Try close ad banner

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
