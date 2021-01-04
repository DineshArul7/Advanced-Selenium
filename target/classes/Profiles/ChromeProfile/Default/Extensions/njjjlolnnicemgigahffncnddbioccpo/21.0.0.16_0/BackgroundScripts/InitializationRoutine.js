
 var state = "Automation NOT possible. Starting server...";
 
 chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
             
    switch(request.req) {
                 
        case "getState":
           
            sendResponse({
                farewell: state
            });
            break;
    }
});

 var myServer;

 function startServer() {


     try {
         myServer = new JavaScriptServer();
     }
     catch (e) {
        state=("ERROR: \r\n" + e);
     }
     
 
 };



// Reload all Tabs on install or update to inject the new chrome extension.
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install" || details.reason === "update") {
        chrome.tabs.query({}, function (tabs) {
            tabs.forEach(function (tab) {
                if (tab.url.startsWith("chrome://")) {
                    return;
                }
                chrome.tabs.reload(tab.id);
            });
        });
    }
});

startServer();