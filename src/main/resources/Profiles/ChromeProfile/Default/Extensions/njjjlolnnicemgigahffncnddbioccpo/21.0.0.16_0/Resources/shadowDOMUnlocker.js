function shadowDOMUnlocker() {
    var self = this;

    self.originalAttachShadow = null;

    self.originalCreateShadow = null;

    self.containsShadowDomAttributeName = "toscacontainsshadowdom";

    function shadowDomMethod(element, originalMethod, config) {
        var root = null;
        if (originalMethod !== undefined && originalMethod !== null) {
            config.mode = "open";
            root = originalMethod.apply(element, [config]);
            document.documentElement.setAttribute(self.containsShadowDomAttributeName, "true");
        }
        return root;
    }

    function toscaAttachShadow(config) {
        return shadowDomMethod(this, self.originalAttachShadow, config);
    }

    function toscaCreateShadow(config) {
        return shadowDomMethod(this, self.originalCreateShadow, config);
    }

    function overrideShadowDom() {
        if (!Element.prototype.createShadowRoot && !Element.prototype.attachShadow) {
            return;
        }

        if (document.documentElement != null && document.documentElement.getAttribute(self.containsShadowDomAttributeName) === null) {
            document.documentElement.setAttribute(self.containsShadowDomAttributeName, "false");
        }

        if (Element.prototype.attachShadow) {
            self.originalAttachShadow = Element.prototype.attachShadow;
            Element.prototype.attachShadow = toscaAttachShadow;
        }

        if (Element.prototype.createShadowRoot) {
            self.originalCreateShadow = Element.prototype.createShadowRoot;
            Element.prototype.createShadowRoot = toscaCreateShadow;
        }
    }

    overrideShadowDom();
}