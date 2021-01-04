function CommonJavaScriptServer(javaScriptServer, browserType, WsSocket) {
    var self = javaScriptServer;

    InternalProxyObjectImplementation(self);

    self.init = function () {
        self.Reset();
    };

    self.Ping = function () {
        browserType.tabs.query({ 'active': true }, function (tab) {
            browserType.tabs.sendMessage(tab[0].id, { Data: "PING" }, function (response) {
                if (response.Data != "PONG") {
                    state = "Automation NOT possible! Connection to content script lost!";
                }
                else {
                    state = "Automation possible!";
                }
            });
        });
    };

    browserType.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (request.method === "getLogLevel") {
            sendResponse({ logLevel: localStorage['logLevel'] });
        } else if (request.method === "waitForAllFramesToReset") {
            browserType.webNavigation.getAllFrames({ tabId: sender.tab.id },
                function (details) {
                    waitTillAllSearchedFramesAreReset(details, sender, sendResponse, 0);
                });
            return true;
        } else if (request.method === "getFrameIdOfSearchedFrame") {
            browserType.webNavigation.getAllFrames({ tabId: sender.tab.id },
                function (details) {
                    findSearchedFrame(details, sender, sendResponse, 0);
                });
            return true;
        } else if (request.message === "getSfSession") {
            browserType.cookies.get({ url: "https://" + request.sfHost, name: "sid", storeId: sender.tab.cookieStoreId },
                function (sessionCookie) {
                    if (!sessionCookie) {
                        sendResponse(null);
                        return;
                    }
                    sendResponse(sessionCookie.value);
                });
            return true;
        } else if (request.message === "getSfDomain") {
            browserType.tabs.query({ active: true }, function(tabs) {
                browserType.cookies.get({ url: tabs[0].url, name: "sid", storeId: sender.tab.cookieStoreId }, function(cookie){
                    if (!cookie) {
                        sendResponse(null);
                        return;
                    }
                    var orgId = cookie.value.split("!")[0];
                    browserType.cookies.getAll({ name: "sid", domain: "salesforce.com", secure: true, storeId: sender.tab.cookieStoreId }, function(cookies){
                        var sessionCookie = cookies.filter(function(c) { return c.value.startsWith(orgId + "!") })[0];
                        if (sessionCookie) {
                            sendResponse(sessionCookie.domain);
                        } else {
                            sendResponse(null);
                            return;
                        }
                    });
                });
            });
            
            return true;
        }
    });

    function waitTillAllSearchedFramesAreReset(details, sender, sendResponse, retry) {
        var responsesReceived = 0;
        var allFalse = true;
        log("Waiting for " + details.length + " frames to reset.", LOG_SEV_DEBUG)
        for (var i = 0; i < details.length; i++) {
            var detail = details[i];
                browserType.tabs.sendMessage(sender.tab.id,
                    { Data: "IsSearchedFrame", frameId: detail.frameId },
                    { frameId: detail.frameId },
                    function(response) {
                        responsesReceived++;
                        if (response && response.IsSearchedFrame === true) {
                            allFalse = false;
                        }

                        if (responsesReceived === details.length) {
                            if (allFalse === true) {
                                sendResponse({});
                            } else {
                                if (retry < 20) {
                                    waitTillAllSearchedFramesAreReset(details, sender, sendResponse, retry + 1);
                                } else {
                                    sendResponse({});
                                }
                            }
                        }
                    });
        }    }

    function findSearchedFrame(details, sender, sendResponse, retry) {
        var responsesReceived = 0;
        var foundFrameIds = [];
        for (var i = 0; i < details.length; i++) {
            var detail = details[i];
            browserType.tabs.sendMessage(sender.tab.id,
                { Data: "IsSearchedFrame", frameId: detail.frameId },
                { frameId: detail.frameId },
                function (response) {
                    responsesReceived++;
                    if (response && response.IsSearchedFrame === true) {
                        foundFrameIds.push(response.frameId);
                    }
                    if (responsesReceived === details.length) {
                        if (foundFrameIds.length === 1) {
                            sendResponse({ frameId: foundFrameIds[0] });
                        } else {
                            if (retry < 20) {
                                findSearchedFrame(details, sender, sendResponse, retry + 1);
                            } else {
                                sendResponse({ frameId: -1});
                            }
                        }
                    }
                });
        }
    }

    //=================================Dispatching requests==================================

    self.ProcessRequest = function(request, tabId, frameIndex) {
        try {
            SendRequestToSpecificTab(request, tabId, frameIndex);
        } catch (e) {
            var LB = "\r\n";
            var errBuffer = e.toString() + LB;
            errBuffer += "StackTrace: " + e.stack + LB;
            log(errBuffer, LOG_SEV_ERROR);
        }
    };

    self.ResetAllTabs = function(request) {
        browserType.tabs.query({}, function (tab) {
            for (var i = 0; i < tab.length; i++) {
                SendRequestToTab(tab[i], request);
            }
        });
    }

    self.PingTabBeforeCall = function(id, maxRetries, includeTimeout, callback) {
        var hasReturned = false;
        browserType.tabs.sendMessage(id, { Data: "PING" }, function (response) {
            if (!hasReturned) {
                hasReturned = true;
                if ((browserType.runtime.lastError === undefined || browserType.runtime.lastError === null) && response && response.Data === "PONG") {
                    callback();
                    return;
                }

                if (maxRetries < 0) {
                    self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
                }

                self.PingTabBeforeCall(id, maxRetries - 1, includeTimeout, callback);
            }
        });

        if (includeTimeout) {
            setTimeout(function() {

                    if (!hasReturned) {
                        hasReturned = true;
                        self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
                    }
                },
                2000);
        }
    }

    function HandleResponse(response) {
        if (response && response.Data) {
            WsSocket.send(response.Data);
            return;
        }
        state = "Automation NOT possible! Connection to content script lost!";
        self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
    }

    function SendRequestToTab(tab, frameIndex, request) {
        var tabResponded = false;
        if (typeof (frameIndex) !== typeof (undefined)) {
                browserType.tabs.sendMessage(tab.id,
                    { Data: request },
                    { frameId: frameIndex },
                    function (response) {
                        tabResponded = true;
                        HandleResponse(response);
                    });
        } else {
            browserType.tabs.sendMessage(tab.id,
                { Data: request },
                function(response) {
                    tabResponded = true;
                    HandleResponse(response);
                });
        }

        setTimeout(function () {
                if (!tabResponded) {
                    self.PingTabBeforeCall(tab.id, 1, false, function () {
                        if (!tabResponded) {
                            log("Got no respnse from tab after 30 s. Request: " + request, LOG_SEV_ERROR);
                            self.SendFailedTransactionResponse("Cannot interact with the tab. Please check if the page is loaded.");
                        }
                    });
                }

            }, 30000);
    }


    function SendRequestToSpecificTab(request, tabId, frameIndex) {
        browserType.tabs.get(tabId, function (tab) {
            if (browserType.runtime.lastError !== undefined && browserType.runtime.lastError !== null) {
                self.SendFailedTransactionResponse("Cannot interact with the tab. The following error occurred: " + browserType.runtime.lastError.message);
                return;
            }
            if (tab.status !== "complete") {
                self.SendFailedTransactionResponse("Cannot interact with busy tab.");
                return;
            }
            SendRequestToTab(tab, frameIndex, request);
        });
    }


    self.SendFailedTransactionResponse = function(message) {
        var failedResponse = new TransactionFailedResponse();
        failedResponse.Message = message;
        WsSocket.send(JSON.stringify(failedResponse));
    }

    //=================================End of Dispatching requests==================================
}

function InternalProxyObjectImplementation(javaScriptServer) {
    var self = javaScriptServer;

    self.InternalProxyObject = new InternalProxy();

    self.AddObject = function (obj) {
        return (self.InternalProxyObject.AddObject(obj));
    };

    self.GetObject = function (referenceId) {
        return self.InternalProxyObject.GetObject(referenceId);
    };

    self.DeleteObject = function (referenceId) {
        return self.InternalProxyObject.DeleteObject(referenceId);
    };
}

function CommonWebSocket(IPAddr, portNumber, serverName) {
    function GetUrl() {
        var portSettingName = "port";
        if (!localStorage[portSettingName]) {
            localStorage[portSettingName] = portNumber;
        }
        return IPAddr + localStorage[portSettingName] + serverName;
    };

    var WsSocket = new WebSocket(GetUrl());

    WsSocket.onopen = function () {
        state = "Automation possible!";
    };

    WsSocket.onclose = function () {
        state = "Automation NOT possible! Connection to server lost, trying to reconnect...";
        setTimeout(function () { startServer() }, 5000);
    };
    WsSocket.onerror = function (errorEvent) {
        logEvent("Error while connecting to Service", LOG_SEV_ERROR, errorEvent);
    };

    return WsSocket;
}