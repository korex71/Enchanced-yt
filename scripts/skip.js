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

window.onload = async () => {
  let styles = ".ytp-ad-image-overlay { display: none!important } ";
  styles +=
    ".ytp-ad-overlay-container, #player-ads { display: none!important } ";
  styles += ".ytp-ad-message-overlay { display: none!important } ";
  styles += ".video-ads { display: none!important } ";
  styles += ".ytmusic-popup-container { display: none!important } ";

  $css(styles);

  clearFirstAd();

  const player = await each("#movie_player");

  console.log(player);

  mountObserver(player);
};

const clearFirstAd = () => {
  let attempts = 0;

  while (attempts < 3) {
    attempts++;

    skipAd();
  }
};

const each = async (selector) => {
  return new Promise((resolve) => {
    let timeout = setTimeout(() => {
      const element = document.querySelector(selector);

      if (element) {
        resolve(element);
        return clearTimeout(timeout);
      }
    }, 50);
  });
};

const skipAd = () => {
  $click("button.ytp-ad-overlay-close-button"); // Try close ad banner

  const element = document.querySelector(".ad-showing video");

  if (element) {
    $click("button.ytp-ad-skip-button"); // Click on "skip"
    if (isFinite(element.duration)) {
      element.currentTime = element.duration;
      $click("button.ytp-ad-skip-button"); // Click on "skip"
    }
  }
};

const mountObserver = (player) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName == "class") {
        var adShowing = mutation.target.classList.contains(".ad-showing");

        if (adShowing) {
          console.log("Cleared by observer");

          const element = document.querySelector(".ad-showing video");

          if (isFinite(element.duration)) {
            element.currentTime = element.duration;
            $click("button.ytp-ad-skip-button"); // Click on "skip"
          }
        }
      }
    });
  });

  observer.observe(player, {
    attributeOldValue: true,
    attributes: true,
  });
};

var attempts = 0;
let attepmttry = setTimeout(() => {
  skipAd();
  attempts++;
  if (attempts > 10) clearTimeout(attepmttry);
}, 50);
