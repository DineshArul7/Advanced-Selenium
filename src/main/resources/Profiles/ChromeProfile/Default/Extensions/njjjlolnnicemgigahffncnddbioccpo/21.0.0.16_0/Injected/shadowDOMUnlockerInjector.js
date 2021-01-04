
function injectScript(resourcePath, initCode) {
    if (window.document.head === null) {
        window.setTimeout(function () { injectScript(resourcePath, initCode); }, 10);
        return;
    }

    var script = chrome.extension.getURL(resourcePath);
    var el = window.document.createElement('script');
    el.src = script;

    el.onload = function () {
        var loadScript = window.document.createElement('script');
        loadScript.innerHTML = initCode;
        window.document.head.appendChild(loadScript);
    };

    window.document.head.appendChild(el);
}

injectScript("Resources/shadowDOMUnlocker.js", "var unlocker = new shadowDOMUnlocker();");
chrome.runtime.sendMessage({ method: "getEnableAlertAlerter" }, function(response) {
    if (response === undefined || response === null || response.enableAlertAlerter !== "true") {
        return;
    }
    injectScript("Resources/alertAlerter.js", "var toscaAlertAlerter = new toscaAlertAlerter();");
});
