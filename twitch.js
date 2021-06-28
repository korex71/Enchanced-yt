function updateSettings() {
  chrome.storage.local.get(["onOffTTV"], function (result) {
    if (result.onOffTTV == "true" || result.onOffTTV == "false") {
      window.postMessage(
        {
          type: "onOff",
          value: result.onOffTTV,
        },
        "*"
      );
    }
  });
  chrome.storage.local.get(["fullQualityTTV"], function (result) {
    if (result.fullQualityTTV == "true" || result.fullQualityTTV == "false") {
      window.postMessage(
        {
          type: "fullQuality",
          value: result.fullQualityTTV,
        },
        "*"
      );
    }
  });
  chrome.storage.local.get(["blockingMessageTTV"], function (result) {
    if (
      result.blockingMessageTTV == "true" ||
      result.blockingMessageTTV == "false"
    ) {
      window.postMessage(
        {
          type: "blockingMessage",
          value: result.blockingMessageTTV,
        },
        "*"
      );
    }
  });
}

function removeVideoAds() {
  //This stops Twitch from pausing the player when in another tab and an ad shows.
  Object.defineProperty(document, "visibilityState", {
    get() {
      return "visible";
    },
  });
  Object.defineProperty(document, "hidden", {
    get() {
      return false;
    },
  });
  const block = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };
  document.addEventListener("visibilitychange", block, true);
  document.addEventListener("webkitvisibilitychange", block, true);
  document.addEventListener("mozvisibilitychange", block, true);
  document.addEventListener("hasFocus", block, true);
  if (/Firefox/.test(navigator.userAgent)) {
    Object.defineProperty(document, "mozHidden", {
      get() {
        return false;
      },
    });
  } else {
    Object.defineProperty(document, "webkitHidden", {
      get() {
        return false;
      },
    });
  }

  //Send settings updates to worker.
  window.addEventListener(
    "message",
    (event) => {
      if (event.data.type && event.data.type == "onOff") {
        if (twitchMainWorker) {
          twitchMainWorker.postMessage({
            key: "onOff",
            value: event.data.value,
          });
        }
      } else if (event.data.type && event.data.type == "fullQuality") {
        if (twitchMainWorker) {
          twitchMainWorker.postMessage({
            key: "fullQuality",
            value: event.data.value,
          });
        }
      } else if (event.data.type && event.data.type == "blockingMessage") {
        if (twitchMainWorker) {
          twitchMainWorker.postMessage({
            key: "blockingMessage",
            value: event.data.value,
          });
        }
      }
    },
    false
  );

  function declareOptions(scope) {
    scope.AdSignifier = "stitched-ad";
    scope.ClientID = "kimne78kx3ncx6brgo4mv6wki5h1ko";
    scope.PlayerType1 = "site"; //Source
    scope.PlayerType2 = "thunderdome"; //480p
    scope.PlayerType3 = "pop_tart"; //480p
    scope.PlayerType4 = "picture-by-picture"; //360p
    scope.AdFreeWeaverURLPlayer1 = null;
    scope.AdFreeWeaverURLPlayer2 = null;
    scope.CurrentChannelNameFromM3U8 = null;
    scope.RootM3U8Params = null;
    scope.WasShowingAd = false;
    scope.GQLDeviceID = null;
    scope.OnOff = true;
    scope.FullQuality = true;
    scope.BlockingMessage = false;
  }

  declareOptions(window);

  var twitchMainWorker = null;

  var adBlockDiv = null;

  const oldWorker = window.Worker;

  window.Worker = class Worker extends oldWorker {
    constructor(twitchBlobUrl) {
      if (twitchMainWorker) {
        super(twitchBlobUrl);
        return;
      }
      var jsURL = getWasmWorkerUrl(twitchBlobUrl);
      if (typeof jsURL !== "string") {
        super(twitchBlobUrl);
        return;
      }
      var newBlobStr = `
              ${processM3U8.toString()}
              ${hookWorkerFetch.toString()}
              ${declareOptions.toString()}
              ${getAccessToken.toString()}
              ${gqlRequest.toString()}
              ${adRecordgqlPacket.toString()}
              ${tryNotifyAdsWatchedM3U8.toString()}
              ${parseAttributes.toString()}
              declareOptions(self);
              self.addEventListener('message', function(e) {
                  if (e.data.key == 'UpdateDeviceId') {
                      GQLDeviceID = e.data.value;
                  }
                  if (e.data.key == 'onOff') {
                     if (e.data.value == "true") {
                     OnOff = true;
                     } else if (e.data.value == "false") {
                     OnOff = false;
                     }
                  }
                  if (e.data.key == 'fullQuality') {
                      if (e.data.value == "true") {
                      FullQuality = true;
                      } else if (e.data.value == "false") {
                      FullQuality = false;
                      }
                  }
                  if (e.data.key == 'blockingMessage') {
                      if (e.data.value == "true") {
                      BlockingMessage = true;
                      } else if (e.data.value == "false") {
                      BlockingMessage = false;
                      }
                  }
              });
              hookWorkerFetch();
              importScripts('${jsURL}');
          `;
      super(URL.createObjectURL(new Blob([newBlobStr])));
      twitchMainWorker = this;
      this.onmessage = function (e) {
        if (e.data.key == "ShowAdBlockBanner") {
          if (adBlockDiv == null) {
            adBlockDiv = getAdBlockDiv();
          }
          adBlockDiv.P.textContent = "Blocking ads...";
          adBlockDiv.style.display = "block";
        } else if (e.data.key == "HideAdBlockBanner") {
          if (adBlockDiv == null) {
            adBlockDiv = getAdBlockDiv();
          }
          adBlockDiv.style.display = "none";
        } else if (e.data.key == "PauseResumePlayer") {
          reloadTwitchPlayer(true);
        } else if (e.data.key == "ShowDonateBanner") {
          if (adBlockDiv == null) {
            adBlockDiv = getAdBlockDiv();
          }
          adBlockDiv.P.textContent = "Help support us...";
          adBlockDiv.style.display = "block";
        }
      };

      function getAdBlockDiv() {
        //To display a notification to the user, that an ad is being blocked.
        var playerRootDiv = document.querySelector(".video-player");
        var adBlockDiv = null;
        if (playerRootDiv != null) {
          adBlockDiv = playerRootDiv.querySelector(".adblock-overlay");
          if (adBlockDiv == null) {
            adBlockDiv = document.createElement("div");
            adBlockDiv.className = "adblock-overlay";
            adBlockDiv.innerHTML =
              '<a href="https://paypal.me/ttvadblock" target="_blank"><div class="player-adblock-notice" style="color: white; background-color: rgba(0, 0, 0, 0.8); position: absolute; top: 0px; left: 0px; padding: 5px;"><p></p></div></a>';
            adBlockDiv.style.display = "none";
            adBlockDiv.P = adBlockDiv.querySelector("p");
            playerRootDiv.appendChild(adBlockDiv);
          }
        }
        return adBlockDiv;
      }
    }
  };

  function getWasmWorkerUrl(twitchBlobUrl) {
    var req = new XMLHttpRequest();
    req.open("GET", twitchBlobUrl, false);
    req.send();
    return req.responseText.split("'")[1];
  }

  async function processM3U8(url, textStr, realFetch, playerType) {
    //Checks the m3u8 for ads and if it finds one, instead returns an ad-free stream.

    if (!textStr) {
      return textStr;
    }

    if (!textStr.includes(".ts")) {
      return textStr;
    }

    var haveAdTags = textStr.includes(AdSignifier);

    if (haveAdTags) {
      //Reduces ad frequency.
      try {
        tryNotifyAdsWatchedM3U8(textStr);
      } catch (err) {}

      //Saves doing multiple GQL requests if we already have the ad-free weaver url.
      try {
        if (FullQuality == false && AdFreeWeaverURLPlayer2) {
          var savedStreamM3u8Response = await realFetch(AdFreeWeaverURLPlayer2);
          if (savedStreamM3u8Response.status == 200) {
            var savedm3u8Text = await savedStreamM3u8Response.text();
            if (!savedm3u8Text.includes(AdSignifier)) {
              if (BlockingMessage == true) {
                postMessage({
                  key: "HideAdBlockBanner",
                });
              }
              return savedm3u8Text;
            } else {
              AdFreeWeaverURLPlayer2 = null;
            }
          } else {
            AdFreeWeaverURLPlayer2 = null;
          }
        } else if (AdFreeWeaverURLPlayer1) {
          var savedStreamM3u8Response = await realFetch(AdFreeWeaverURLPlayer1);
          if (savedStreamM3u8Response.status == 200) {
            var savedm3u8Text = await savedStreamM3u8Response.text();
            if (!savedm3u8Text.includes(AdSignifier)) {
              if (BlockingMessage == true) {
                postMessage({
                  key: "HideAdBlockBanner",
                });
              }
              return savedm3u8Text;
            } else {
              AdFreeWeaverURLPlayer1 = null;
            }
          } else {
            AdFreeWeaverURLPlayer1 = null;
          }
        }
      } catch (err) {}

      var accessTokenResponse = await getAccessToken(
        CurrentChannelNameFromM3U8,
        playerType
      );

      if (accessTokenResponse.status === 200) {
        var accessToken = await accessTokenResponse.json();

        try {
          var urlInfo = new URL(
            "https://usher.ttvnw.net/api/channel/hls/" +
              CurrentChannelNameFromM3U8 +
              ".m3u8" +
              RootM3U8Params
          );
          urlInfo.searchParams.set(
            "sig",
            accessToken.data.streamPlaybackAccessToken.signature
          );
          urlInfo.searchParams.set(
            "token",
            accessToken.data.streamPlaybackAccessToken.value
          );
          var encodingsM3u8Response = await realFetch(urlInfo.href);
          if (encodingsM3u8Response.status === 200) {
            var encodingsM3u8 = await encodingsM3u8Response.text();
            var streamM3u8Url = encodingsM3u8.match(/^https:.*\.m3u8$/m)[0];

            var streamM3u8Response = await realFetch(streamM3u8Url);
            if (streamM3u8Response.status == 200) {
              var m3u8Text = await streamM3u8Response.text();
              if (!m3u8Text.includes(AdSignifier)) {
                if (playerType == PlayerType2) {
                  AdFreeWeaverURLPlayer2 = streamM3u8Url;
                }
                if (playerType == PlayerType1) {
                  AdFreeWeaverURLPlayer1 = streamM3u8Url;
                }
              }
              WasShowingAd = true;
              if (BlockingMessage == false) {
                if (Math.floor(Math.random() * 4) == 3) {
                  postMessage({
                    key: "ShowDonateBanner",
                  });
                } else {
                  postMessage({
                    key: "ShowAdBlockBanner",
                  });
                }
              } else if (BlockingMessage == true) {
                postMessage({
                  key: "HideAdBlockBanner",
                });
              }
              return m3u8Text;
            } else {
              return textStr;
            }
          } else {
            return textStr;
          }
        } catch (err) {}
        return textStr;
      } else {
        return textStr;
      }
    } else {
      if (WasShowingAd) {
        AdFreeWeaverURLPlayer2 = null;
        AdFreeWeaverURLPlayer1 = null;
        WasShowingAd = false;
        postMessage({
          key: "PauseResumePlayer",
        });
        postMessage({
          key: "HideAdBlockBanner",
        });
      }
      return textStr;
    }
    return textStr;
  }

  function parseAttributes(str) {
    return Object.fromEntries(
      str
        .split(/(?:^|,)((?:[^=]*)=(?:"[^"]*"|[^,]*))/)
        .filter(Boolean)
        .map((x) => {
          const idx = x.indexOf("=");
          const key = x.substring(0, idx);
          const value = x.substring(idx + 1);
          const num = Number(value);
          return [
            key,
            Number.isNaN(num)
              ? value.startsWith('"')
                ? JSON.parse(value)
                : value
              : num,
          ];
        })
    );
  }

  async function tryNotifyAdsWatchedM3U8(streamM3u8) {
    var matches = streamM3u8.match(
      /#EXT-X-DATERANGE:(ID="stitched-ad-[^\n]+)\n/
    );
    if (matches.length > 1) {
      const attrString = matches[1];
      const attr = parseAttributes(attrString);
      var podLength = parseInt(
        attr["X-TV-TWITCH-AD-POD-LENGTH"]
          ? attr["X-TV-TWITCH-AD-POD-LENGTH"]
          : "1"
      );
      var podPosition = parseInt(
        attr["X-TV-TWITCH-AD-POD-POSITION"]
          ? attr["X-TV-TWITCH-AD-POD-POSITION"]
          : "0"
      );
      var radToken = attr["X-TV-TWITCH-AD-RADS-TOKEN"];
      var lineItemId = attr["X-TV-TWITCH-AD-LINE-ITEM-ID"];
      var orderId = attr["X-TV-TWITCH-AD-ORDER-ID"];
      var creativeId = attr["X-TV-TWITCH-AD-CREATIVE-ID"];
      var adId = attr["X-TV-TWITCH-AD-ADVERTISER-ID"];
      var rollType = attr["X-TV-TWITCH-AD-ROLL-TYPE"].toLowerCase();
      const baseData = {
        stitched: true,
        roll_type: rollType,
        player_mute: true,
        player_volume: 0.0,
        visible: false,
      };
      for (let podPosition = 0; podPosition < podLength; podPosition++) {
        const extendedData = {
          ...baseData,
          ad_id: adId,
          ad_position: podPosition,
          duration: 0,
          creative_id: creativeId,
          total_ads: podLength,
          order_id: orderId,
          line_item_id: lineItemId,
        };
        await gqlRequest(
          adRecordgqlPacket("video_ad_impression", radToken, extendedData)
        );
        for (let quartile = 0; quartile < 4; quartile++) {
          await gqlRequest(
            adRecordgqlPacket("video_ad_quartile_complete", radToken, {
              ...extendedData,
              quartile: quartile + 1,
            })
          );
        }
        await gqlRequest(
          adRecordgqlPacket("video_ad_pod_complete", radToken, baseData)
        );
      }
    }
  }

  function hookWorkerFetch() {
    var realFetch = fetch;
    fetch = async function (url, options) {
      if (typeof url === "string") {
        if (url.includes("video-weaver")) {
          return new Promise(function (resolve, reject) {
            var processAfter = async function (response) {
              //Here we check the m3u8 for any ads and also try fallback player types if needed.
              //We first check if we can get a source quality ad-free stream.
              var responseText = await response.text();
              if (OnOff == false) {
                resolve(new Response(responseText));
              } else {
                var weaverText = null;
                if (FullQuality == true) {
                  weaverText = await processM3U8(
                    url,
                    responseText,
                    realFetch,
                    PlayerType1
                  );
                  if (weaverText.includes(AdSignifier)) {
                    weaverText = await processM3U8(
                      url,
                      responseText,
                      realFetch,
                      PlayerType2
                    );
                  }
                  if (weaverText.includes(AdSignifier)) {
                    weaverText = await processM3U8(
                      url,
                      responseText,
                      realFetch,
                      PlayerType3
                    );
                  }
                  if (weaverText.includes(AdSignifier)) {
                    weaverText = await processM3U8(
                      url,
                      responseText,
                      realFetch,
                      PlayerType4
                    );
                  }
                } else {
                  weaverText = await processM3U8(
                    url,
                    responseText,
                    realFetch,
                    PlayerType2
                  );
                  if (weaverText.includes(AdSignifier)) {
                    weaverText = await processM3U8(
                      url,
                      responseText,
                      realFetch,
                      PlayerType3
                    );
                  }
                  if (weaverText.includes(AdSignifier)) {
                    weaverText = await processM3U8(
                      url,
                      responseText,
                      realFetch,
                      PlayerType4
                    );
                  }
                }
                resolve(new Response(weaverText));
              }
            };
            var send = function () {
              return realFetch(url, options)
                .then(function (response) {
                  processAfter(response);
                })
                ["catch"](function (err) {
                  reject(err);
                });
            };
            send();
          });
        } else if (url.includes("/api/channel/hls/")) {
          var channelName = new URL(url).pathname.match(
            /([^\/]+)(?=\.\w+$)/
          )[0];
          RootM3U8Params = new URL(url).search;
          AdFreeWeaverURLPlayer2 = null;
          AdFreeWeaverURLPlayer1 = null;
          CurrentChannelNameFromM3U8 = channelName;
          //To prevent pause/resume loop for mid-rolls.
          var isPBYPRequest = url.includes("picture-by-picture");
          if (isPBYPRequest) {
            url = "";
          }
        }
      }
      return realFetch.apply(this, arguments);
    };
  }

  function getAccessToken(channelName, playerType, realFetch) {
    var body = null;
    var templateQuery =
      'query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) {    value    signature    __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) {    value    signature    __typename  }}';
    body = {
      operationName: "PlaybackAccessToken_Template",
      query: templateQuery,
      variables: {
        isLive: true,
        login: channelName,
        isVod: false,
        vodID: "",
        playerType: playerType,
      },
    };
    return gqlRequest(body, realFetch);
  }

  function gqlRequest(body, realFetch) {
    var fetchFunc = realFetch ? realFetch : fetch;
    if (!GQLDeviceID) {
      var dcharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
      var dcharactersLength = dcharacters.length;
      for (var i = 0; i < 32; i++) {
        GQLDeviceID += dcharacters.charAt(
          Math.floor(Math.random() * dcharactersLength)
        );
      }
    }
    return fetchFunc("https://gql.twitch.tv/gql", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "client-id": ClientID,
        "X-Device-Id": GQLDeviceID,
      },
    });
  }

  function adRecordgqlPacket(event, radToken, payload) {
    return [
      {
        operationName: "ClientSideAdEventHandling_RecordAdEvent",
        variables: {
          input: {
            eventName: event,
            eventPayload: JSON.stringify(payload),
            radToken,
          },
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              "7e6c69e6eb59f8ccb97ab73686f3d8b7d85a72a0298745ccd8bfc68e4054ca5b",
          },
        },
      },
    ];
  }

  function reloadTwitchPlayer(isPausePlay) {
    //This will do an instant pause/play to return to original quality once the ad is finished.
    try {
      var videoController = document.querySelector(".video-player__overlay");
      if (videoController) {
        videoController.style.visibility = "hidden";
      }

      function findReactNode(root, constraint) {
        if (root.stateNode && constraint(root.stateNode)) {
          return root.stateNode;
        }
        let node = root.child;
        while (node) {
          const result = findReactNode(node, constraint);
          if (result) {
            return result;
          }
          node = node.sibling;
        }
        return null;
      }
      var reactRootNode = null;
      var rootNode = document.querySelector("#root");
      if (
        rootNode &&
        rootNode._reactRootContainer &&
        rootNode._reactRootContainer._internalRoot &&
        rootNode._reactRootContainer._internalRoot.current
      ) {
        reactRootNode = rootNode._reactRootContainer._internalRoot.current;
      }
      if (!reactRootNode) {
        if (videoController) {
          videoController.style.visibility = "visible";
        }
        return;
      }
      var player = findReactNode(
        reactRootNode,
        (node) =>
          node.setPlayerActive && node.props && node.props.mediaPlayerInstance
      );
      player =
        player && player.props && player.props.mediaPlayerInstance
          ? player.props.mediaPlayerInstance
          : null;
      var playerState = findReactNode(
        reactRootNode,
        (node) => node.setSrc && node.setInitialPlaybackSettings
      );
      if (!player) {
        if (videoController) {
          videoController.style.visibility = "visible";
        }
        return;
      }
      if (!playerState) {
        if (videoController) {
          videoController.style.visibility = "visible";
        }
        return;
      }
      if (player.paused) {
        if (videoController) {
          videoController.style.visibility = "visible";
        }
        return;
      }
      if (isPausePlay) {
        player.pause();
        player.play();
        setTimeout(function () {
          if (videoController) {
            videoController.style.visibility = "visible";
          }
        }, 6500);
        return;
      }
    } catch (err) {
      var videoController = document.querySelector(".video-player__overlay");
      if (videoController) {
        videoController.style.visibility = "visible";
      }
    }
  }

  function generateRandomGQLDeviceID() {
    var randomGQLDeviceID = "eVI6jx47kJvCFfFowK86eVI6jx47kJvC";
    try {
      var alphaNum =
        "abcdefghijklmnopqrstuvwxyz123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567";

      var currentDate = new Date();
      var currentDateStart = new Date(currentDate.getFullYear(), 0, 0);
      var dateDifference =
        currentDate -
        currentDateStart +
        (currentDateStart.getTimezoneOffset() -
          currentDate.getTimezoneOffset()) *
          60 *
          1000;
      var oneDay = 1000 * 60 * 60 * 24;

      var currentDayNumber = Math.floor(dateDifference / oneDay);

      var letterNumLocation = currentDayNumber / 6;
      letterNumLocation = letterNumLocation.toFixed(0);
      var letterNumToChangeTo = alphaNum.charAt(letterNumLocation);
      letterNumLocation = letterNumLocation / 2;
      letterNumLocation = letterNumLocation.toFixed(0);

      randomGQLDeviceID = randomGQLDeviceID.split("");
      randomGQLDeviceID[letterNumLocation] = letterNumToChangeTo;
      randomGQLDeviceID = randomGQLDeviceID.join("");
    } catch (err) {}
    return randomGQLDeviceID;
  }

  function hookFetch() {
    var realFetch = window.fetch;
    window.fetch = function (url, init, ...args) {
      if (typeof url === "string") {
        if (url.includes("/access_token") || url.includes("gql")) {
          //Device ID is used when notifying ads as watched, to slow ad frequency, only if random device ID fails.
          var deviceId = init.headers["X-Device-Id"];
          if (typeof deviceId !== "string") {
            deviceId = init.headers["Device-ID"];
          }
          if (typeof deviceId === "string") {
            GQLDeviceID = deviceId;
          }
          if (GQLDeviceID && twitchMainWorker) {
            twitchMainWorker.postMessage({
              key: "UpdateDeviceId",
              value: GQLDeviceID,
            });
          }
          //To prevent pause/resume loop for mid-rolls.
          if (
            url.includes("gql") &&
            init &&
            typeof init.body === "string" &&
            init.body.includes("PlaybackAccessToken") &&
            init.body.includes("picture-by-picture")
          ) {
            init.body = "";
          }
          var isPBYPRequest = url.includes("picture-by-picture");
          if (isPBYPRequest) {
            url = "";
          }
        }
      }
      return realFetch.apply(this, arguments);
    };
  }

  hookFetch();
}
var script = document.createElement("script");
script.appendChild(document.createTextNode("(" + removeVideoAds + ")();"));
(document.body || document.head || document.documentElement).appendChild(
  script
);
setTimeout(function () {
  updateSettings();
}, 1000);
