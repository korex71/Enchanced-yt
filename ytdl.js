// Download button

(function () {
  if (
    document.getElementById("browser-app") ||
    document.getElementById("masthead") ||
    window.Polymer
  ) {
    setInterval(function () {
      if (window.location.href.indexOf("watch?v=") < 0) {
        return false;
      }
      if (
        document.getElementById("meta-contents") &&
        document.getElementById("enchanced-download") === null
      ) {
        AddYT();
      }
    }, 1);

    setElement = function (url) {
      let regExp =
        /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
      let match = String(url).match(regExp);
      return match && match[7].length == 11 ? match[7] : false;
    };
  }

  function AddYT() {
    let buttonDiv = document.createElement("span");
    let addButton = document.createElement("a");

    buttonDiv.style.cssText = `display:flex;padding:10px 3px;`;

    buttonDiv.id = "enchanced-download";

    addButton.target = "_blank";

    addButton.appendChild(document.createTextNode("DOWNLOAD"));

    addButton.style.cssText = `
      width:100%;
      cursor:pointer;
      height:inherit;
      background-color:#393939;
      color:#fff;
      padding:10px 0px;
      margin:0px 0px;
      border:0;
      border-radius:2px;
      font-size:1.4rem;
      font-family:inherit;
      text-align:center;
      text-decoration:none;
    `;

    addButton.href =
      "http://kore.zapto.org/api/youtube/" +
      encodeURIComponent(setElement(window.location));
    buttonDiv.appendChild(addButton);
    let targetElement = document.querySelectorAll("[id='subscribe-button']");
    if (targetElement) {
      for (let i = 0; i < targetElement.length; i++) {
        if (
          targetElement[i].className.indexOf(
            "ytd-video-secondary-info-renderer"
          ) > -1
        ) {
          targetElement[i].appendChild(buttonDiv);
        }
      }
    }
    let descriptionBox = document.querySelectorAll(
      "ytd-video-secondary-info-renderer"
    );
    if (descriptionBox[0].className.indexOf("loading") > -1) {
      descriptionBox[0].classList.remove("loading");
    }
  }
})();

// Download button
