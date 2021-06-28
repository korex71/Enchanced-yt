(() => {
  const timeout = setInterval(() => {
    // First try skip click
    const skipAdBtn = document.querySelector("button.ytp-ad-skip-button");

    if (skipAdBtn) skipAdBtn.click();

    // Force skip.
    const ad = [...document.querySelectorAll(".ad-showing")][0];
    if (ad) {
      const video = document.querySelector("video");
      if (video) {
        video.currentTime = 10000;
      }
    }
  }, 50);

  return function () {
    clearTimeout(timeout);
  };
})();
