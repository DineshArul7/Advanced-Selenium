var loadUrlEvent = document.createEvent('Event');
loadUrlEvent.initEvent('LoadUrl', true, true);

function LoadUrl(url) {
    document.getElementById('editor_url').innerText = url;
    document.getElementById('editor').dispatchEvent(loadUrlEvent);
}

chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
    // Dispatch the request
    if (request.action == "LoadUrl") {
        LoadUrl(request.url);
    }
});
