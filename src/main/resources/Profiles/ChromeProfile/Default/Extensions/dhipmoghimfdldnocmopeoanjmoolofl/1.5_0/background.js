var ENDPOINT = 'http://www.picmonkey.com/chrome_ext';
//var ENDPOINT = 'http://localhost:8000/chrome_ext';

function LoadUrl( loadUrl) {
    var tabUrl = ENDPOINT; // + '?version=X';

    chrome.tabs.create({url: tabUrl}, function(tab) {
        var targetId = tab.id;

        var onLoaded  = function(tabId, changedProps) {
            // Ignore events until we've actually completed the load
            if (tabId != targetId || changedProps.status != "complete")
              return;
            chrome.tabs.onUpdated.removeListener(onLoaded);

            // Insert our interface script
            chrome.tabs.executeScript( tabId, { file: "editor_interface.js" }, function() {
                // Script has loaded, fire the request now
                chrome.tabs.sendRequest( tabId, { action: 'LoadUrl', url: loadUrl} )
            });
        };
        chrome.tabs.onUpdated.addListener(onLoaded);
    });
}

function LoadScreenshot() {
    chrome.tabs.captureVisibleTab(null, {"format":"png"}, function(dataUrl) {
        LoadUrl(dataUrl);
    });
}

