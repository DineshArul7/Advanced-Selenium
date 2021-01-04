function toscaAlertAlerter() {
    self.originalAlert = null;

    function toscaAlert(msg) {
        var alertOpenedEvent = new Event("ToscaAlertOpened");
        document.dispatchEvent(alertOpenedEvent);

        self.originalAlert.apply(window, [msg]);

        var alertClosedEvent = new Event("ToscaAlertClosed");
        document.dispatchEvent(alertClosedEvent);
    }

    function overrideAlertMethod() {
        try {
            self.originalAlert = window.alert;
            window.alert = toscaAlert;
        } catch (e) {
            console.log("Error while overriding alert method:");
            console.log(e);
        } 
    }

    overrideAlertMethod();
}