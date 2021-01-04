function JavaScriptServer() {
    var self = this;
    var requestHandler = new RequestHandler(self);
    var WsSocket;

    self.EntryPoint = null;
    self.Reset = function () {
        self.EntryPoint = new ChromeRootEntryPoint();
        self.InternalProxyObject.Reset();
        self.InternalProxyObject.AddObject(self.EntryPoint);
    };
    //==============================WsSocket==============================

    function ConvertByteStringToInt(byteString) {
        return (byteString.charCodeAt(0) + (byteString.charCodeAt(1) << 8) + (byteString.charCodeAt(2) << 16) + (byteString.charCodeAt(3) << 24)) * 1;
    }

    function createGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function setAlertOpen(state, tabId) {
        self.EntryPoint.GetAllTabsUnfiltered(
            function (tabs) {
                var closedAlertDoc = self.EntryPoint.DocumentTabs.find(docTab => docTab.id === tabId);
                closedAlertDoc.alertOpen = state;
                log("alertOpen set to " + state + " on corresponding DocumentTab instance", LOG_SEV_DEBUG);
            });
    }

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.method === "AlertOpened") {
            log("Alert opened in tab (Id='" + sender.tab.id + "' Title='" + sender.tab.title + "' Url='" + sender.tab.url + "')", LOG_SEV_DEBUG);
            setAlertOpen(true, sender.tab.id);
        } else if (request.method === "AlertClosed") {
            log("Alert closed on tab (Id='" + sender.tab.id + "' Title='" + sender.tab.title + "' Url='" + sender.tab.url + "')", LOG_SEV_DEBUG);
            setAlertOpen(false, sender.tab.id);
        } else if (request.method === "getEnableAlertAlerter") {
            var enableAlertAlerter = localStorage["enableAlertAlerter"];
            if (enableAlertAlerter === undefined || enableAlertAlerter === null) {
                enableAlertAlerter = true;
                localStorage["enableAlertAlerter"] = true;
            }
            sendResponse({enableAlertAlerter: enableAlertAlerter});
        }
    });

    self.startServer = function (uniqueId) {
        WsSocket = CommonWebSocket("ws://localhost:", "17010", uniqueId);

        CommonJavaScriptServer(self, chrome, WsSocket);

        WsSocket.onmessage = function (evt) {
            var tagLength = ConvertByteStringToInt(evt.data.substring(0, 3));
            var tag = evt.data.substring(4, tagLength + 4);
            var text = evt.data.substring(tagLength + 4, evt.data.length);

            if (tag === "Root") {
                var request = JSON.parse(text);
                ProcessRootRequest(request, SendResponseToRelayService);
            } else {
                var serverId = parseInt(tag);
                var chromeDocumentTab = self.EntryPoint.GetChromeDocumentTab(serverId);
                if (!chromeDocumentTab) {
                    self.SendFailedTransactionResponse("DocumentInfomation with id '" + serverId + "' was not found on the server!");
                    return;
                }
                if (chromeDocumentTab.alertOpen === true) {
                    self.SendFailedTransactionResponse("DocumentInfomation with id '" + serverId + "' is currently showing an alert and cannot be accessed!");
                    return;
                }
                self.ProcessRequest(text, chromeDocumentTab.id, chromeDocumentTab.FrameIndex ? chromeDocumentTab.FrameIndex : 0);
            }
        };

        self.init();
    }

    var browserId = null;
    var browserIdPrefix = "ToscaBrowserId";
    log("Looking for BrowserId in LocalStorage", LOG_SEV_DEBUG);
    for (var key in localStorage) {
        if (key.startsWith(browserIdPrefix)) {
            var idStart = key.indexOf("/");
            browserId = key.substring(idStart);
            log("BrowserId found in LocalStorage. Value: " + browserId, LOG_SEV_DEBUG);
            break;
        }
    }
    if (browserId === null) {
        browserId = "/" + createGuid();
        localStorage[browserIdPrefix + browserId] = "1";
        log("BrowserId not found in LocalStorage. Added browserId with value: " + browserId, LOG_SEV_DEBUG);
    }

    self.startServer("/" + chrome.runtime.id + browserId);

    //===============================End Of WsSocket====================================

    function ProcessRootRequest(request, callback) {
        try {
            requestHandler.HandleRequest(request, callback);
        } catch (e) {
            var LB = "\r\n";
            var errBuffer = e.toString() + LB;
            errBuffer += "StackTrace: " + e.stack + LB;
            log(errBuffer, LOG_SEV_ERROR);

            var errorMessage = new TransactionFailedResponse();
            errorMessage.Message = errBuffer;

            callback(errorMessage);
        }

    };
    
    function SendResponseToRelayService(response) {
        WsSocket.send(JSON.stringify(response));
    }

}

function TransactionFailedResponse() {
    this.$type = "Tricentis.Automation.Remoting.Transactions.TransactionFailedResponse, Tricentis.Automation.Remoting";
    this.Uid = "";
    this.Parts = [];
    this.Message = "";
}