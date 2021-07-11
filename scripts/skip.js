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
  let styles = ".ytp-ad-image-overlay { display: none!important } ";
  styles +=
    ".ytp-ad-overlay-container, #player-ads { display: none!important } ";
  styles += ".ytp-ad-message-overlay { display: none!important } ";
  styles += ".video-ads { display: none!important } ";
  styles += ".ytmusic-popup-container { display: none!important } ";

  $css(styles);

  injectObserver();
};

const injectObserver = () => {
  const player = $(".ytd-player");

  if (player) {
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.target.matches("div.video-ads.ytp-ad-module")) {
          const element = document.querySelector(".ad-showing video");
          $click("button.ytp-ad-skip-button"); // Click on "skip"

          if (element) {
            if (isFinite(element.duration)) {
              element.currentTime = element.duration;
              $click("button.ytp-ad-skip-button"); // Click on "skip"
            }
          }
        }
      }
    });

    observer.observe(player, {
      childList: true,
      subtree: true,
    });
  }
};

(() => {
  const timeout = setTimeout(() => {
    $click("button.ytp-ad-overlay-close-button"); // Try close ad banner
    $click("button.ytp-ad-skip-button");
  }, 200);

  return function () {
    clearTimeout(timeout);
  };
})();
