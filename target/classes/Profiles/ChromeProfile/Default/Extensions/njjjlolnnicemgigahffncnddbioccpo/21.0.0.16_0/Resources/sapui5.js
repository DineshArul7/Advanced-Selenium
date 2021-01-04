function sapUi5() {
    var self = this;
    self.InitializeSapUi5 = function () {
        document.addEventListener("tosca_resolve_sapui_type",
            function (e) {
                var id = e.detail;
                if (id) {
                    var element = document.getElementById(id);
                    var sapId = element.getAttribute("data-sap-ui");
                    var object = sap.ui.getCore().byId(sapId);
                    if (object) {
                        var type = object.getMetadata();
                        var name = type.getName();
                        while (type.getParent() != null) {
                            type = type.getParent();
                            name += "|" + type.getName();
                        }
                        element.setAttribute("tosca_sapui_type", name);
                    }
                }
            });

        document.documentElement.setAttribute("tosca_sapui_enabled", true);
    };

    self.ExtractSapUi5Type = function (element) {
        var sapType = "";
        if (element && element.id && typeof element.getAttribute === "function") {
            sapType = element.getAttribute("tosca_sapui_type");
            if (!sapType) {
                var sapId = element.getAttribute("data-sap-ui");
                if (sapId) {
                    var evt = element.ownerDocument.createEvent("CustomEvent");
                    evt.initCustomEvent("tosca_resolve_sapui_type", false, false, element.id);
                    element.ownerDocument.dispatchEvent(evt);
                    sapType = element.getAttribute("tosca_sapui_type");
                }
            }
        }
        return sapType;
    };
}