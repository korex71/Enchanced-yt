(() => {
  const defined = (v) => v !== null && v !== undefined;

  const timeout = setInterval(() => {
    // First try skip click
    const skipAdBtn = document.querySelector("button.ytp-ad-skip-button");

    if (skipAdBtn) skipAdBtn.click();

    // Force skip.
    const ad = [...document.querySelectorAll(".ad-showing")][0];
    if (defined(ad)) {
      const video = document.querySelector("video");
      if (defined(video)) {
        video.currentTime = video.duration;
      }
    }
  }, 50);

  return function () {
    clearTimeout(timeout);
  };
})();
