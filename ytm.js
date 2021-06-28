(() => {
  // Remove "Upgrade" button from youtube music.
  const interval = setInterval(() => {
    const x = document.querySelector(
      "#layout > ytmusic-nav-bar > div.center-content.style-scope.ytmusic-nav-bar > ytmusic-pivot-bar-renderer > ytmusic-pivot-bar-item-renderer:nth-child(4)"
    );

    if (x) {
      x.remove();

      clearInterval(interval);
    }
  }, 5);
})();
