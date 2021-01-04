function AjaxTracer(windowToUse, isIe) {
    var self = this;
    self.myWindow = windowToUse;
    self.isIe = isIe;
    
    self.getOpenRequests = function () {
        return self.myWindow.document.documentElement.getAttribute("openrequests") * 1;
    };
    
    self.setOpenRequests = function(newValue) {
        return self.myWindow.document.documentElement.setAttribute("openrequests", newValue);
    };

    self.increase = function() {
        self.setOpenRequests(self.getOpenRequests() + 1);
     };
    
    self.decrease = function() {
        var openRequests = self.getOpenRequests();
        if (openRequests <= 0) {
            self.setOpenRequests(0);
            return;
        }
        self.setOpenRequests(openRequests - 1);
    };
    
    self.setToZero = function() {
        self.setOpenRequests(0);
    };

    self.delay = 200;

    function newOnError() {
        try {
            if (this.oldOnError !== undefined && this.oldOnError !== null)
                this.oldOnError.apply(this, arguments);
        } finally {
            self.myWindow.setTimeout(self.decrease, self.delay);
        }
    }

    function newonloadend() {
        try {
            if (this.oldOnLoadend !== undefined && this.oldOnLoadend !== null && this.oldOnLoadend !== newonloadend)
                this.oldOnLoadend.apply(this, arguments);

        } finally {
            self.myWindow.setTimeout(self.decrease, self.delay);
        }
    }

    function newonload() {
        try {
            if (this.oldOnLoad !== undefined && this.oldOnLoad !== null && this.oldOnLoad !== newonload)
                this.oldOnLoad.apply(this, arguments);

        } finally {
            self.myWindow.setTimeout(self.decrease, self.delay);
        }
    }

    function newOpen() {
        if (typeof (this.lastReadyState) !== typeof (undefined) && this.lastReadyState > 0 && this.lastReadyState < 4) {
            self.myWindow.setTimeout(self.decrease, self.delay);
        }
        this.lastReadyState = 0;
        this.addEventListener('readystatechange', function () {
            var newReadyState = this.readyState;
            if (this.lastReadyState !== newReadyState) {
                if (newReadyState === 1) {
                    self.increase();
                } else if (newReadyState === 4) {
                    self.myWindow.setTimeout(self.decrease, self.delay);
                }
            }
            this.lastReadyState = newReadyState;
        });
        self.myWindow.toscaOldOpen.apply(this, arguments);
    };

    function newSend() {
        try {
            if (this.oldOnError === undefined || this.oldOnError === null) {
                this.oldOnError = this.onerror;
                this.onerror = newOnError;
            }

            if (this.onloadend !== undefined && (this.oldOnLoadend === undefined || this.oldOnLoadend === null)) {
                this.oldOnLoadend = this.onloadend;
                this.onloadend = newonloadend;
            } else if (this.onload !== undefined && (this.oldOnLoad === undefined || this.oldOnLoad === null)) {
                this.oldOnLoad = this.onload;
                this.onload = newonload;
            } else {
                return;
            }

            self.increase();
        }
        finally {
            self.myWindow.oldSend.apply(this, arguments);
        }
    }

    self.startTracing = function () {
        self.setToZero();

        var request = new self.myWindow.XMLHttpRequest();
        if (request.addEventListener) {
            if (self.myWindow.toscaOldOpen === undefined || self.myWindow.toscaOldOpen === null) {
                self.myWindow.toscaOldOpen = self.myWindow.XMLHttpRequest.prototype.open;
                self.myWindow.XMLHttpRequest.prototype.open = newOpen;
            }
        } else {
            if (self.myWindow.oldSend === undefined || self.myWindow.oldSend === null) {
                self.myWindow.oldSend = self.myWindow.XMLHttpRequest.prototype.send;
                self.myWindow.XMLHttpRequest.prototype.send = newSend;
            }
        }

        if (self.isIe === false) {
            //We only need to inject the ajaxtracer to frames in Chrome and Firefox
            //IE already injects a new entrypoint in each frame
            self.injectToFrames(self.myWindow);
        }
    };

    self.injectToFrames = function (window) {
        for (var i = 0; i < window.frames.length; i++) {
            try {
                var frame = window.frames[i];
                var request = new frame.XMLHttpRequest();
                if (request.addEventListener) {
                    if (frame.toscaOldOpen === undefined || frame.toscaOldOpen === null) {
                        frame.toscaOldOpen = frame.XMLHttpRequest.prototype.open;
                        frame.XMLHttpRequest.prototype.open = newOpen;
                    }
                } else {
                    frame.oldSend = frame.XMLHttpRequest.prototype.send;
                    frame.XMLHttpRequest.prototype.send = newSend;
                }
                self.injectToFrames(frame);
            } catch (e) {
                //Probably because of a cross-domain access violation
            }
        }
    }

    self.stopTracing = function() {
        self.setToZero();

        if (self.myWindow.toscaOldOpen != undefined) {
            self.myWindow.XMLHttpRequest.prototype.open = self.myWindow.toscaOldOpen;
            self.myWindow.toscaOldOpen = undefined;
        }

        if (self.myWindow.oldSend != undefined) {
            self.myWindow.XMLHttpRequest.prototype.send = self.myWindow.oldSend;
            self.myWindow.oldSend = undefined;
        }

        if (self.isIe === false) {
            self.extractFromFrames(self.myWindow);
        }
    };

    self.extractFromFrames = function (window) {
        for (var i = 0; i < window.frames.length; i++) {
            try {
                var frame = window.frames[i];
                if (frame.oldSend != undefined) {
                    frame.XMLHttpRequest.prototype.send = frame.oldSend;
                    frame.oldSend = undefined;
                }

                if (frame.toscaOldOpen != undefined) {
                    frame.XMLHttpRequest.prototype.open = framew.toscaOldOpen;
                    frame.toscaOldOpen = undefined;
                }

                self.extractFromFrames(frame);
            } catch (e) {
                //Probably because of a cross-domain access violation
            }
        }
    }

    self.hasOpenRequests = function() {
        return self.getOpenRequests() > 0;
    };
}