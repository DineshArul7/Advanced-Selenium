chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    sendResponse({});
    /* Get an Access Token */
    var params = Twitter.deparam(request.session);
    Twitter.setOAuthTokens(params);
    Twitter.api('oauth/access_token', 'POST', params, function(res) {
        const params = Twitter.deparam(res)
        Twitter.setOAuthTokens(params);
        Twitter.setUserName(params.screen_name)
    });
});
 //GA implemented
 const details = chrome.runtime.getManifest();
setTimeout(function() {

    (function(i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        (i[r] =
          i[r] ||
          function() {
            (i[r].q = i[r].q || []).push(arguments);
          }),
          (i[r].l = 1 * new Date());
        (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
      })(
        window,
        document,
        'script',
        'https://www.google-analytics.com/analytics.js',
        'ga'
      );
      
      ga('create', 'UA-129804160-1', 'auto');
      ga('set', 'checkProtocolTask', function() {});
      ga('require', 'displayfeatures');
      ga('send', 'pageview', 'background.html?v=' + details.version);
   
}, 1);


const BASE_URL = `https://www.bird-nest-extension.com`;
var installUrl = `${BASE_URL}/installed`;
var uninstallUrl = `${BASE_URL}/uninstalled`;

chrome.runtime.onInstalled.addListener(function(details) {
    if ((details.reason == 'install')) {
        chrome.tabs.create({ url: installUrl });
    }
});

chrome.runtime.setUninstallURL(uninstallUrl);

// Restart timer because of unknown behavior
GLOBAL_TIMER_26 = setTimeout(function() {
  window.location.reload();
}, 21600 * 1000);
