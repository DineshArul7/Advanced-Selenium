/**
* Use this function to log to the console.
*/
function logEvent(msg, severity, event) {
    SetActiveLogLevel();
    if (severity <= ACTIVELOGLEVEL) {
        if (window.console) {
            if (window.console.log) {
                
                window.console.log("[" + severity + "]: " + msg + ": ");
                
                if (event != null) {
                    window.console.log(event);
                }
                
            }
        }
    }
}
function log(msg, severity) {
    logEvent(msg, severity, null);
}

function SetActiveLogLevel() {
    if (ACTIVELOGLEVEL == undefined) {
        ACTIVELOGLEVEL = localStorage["logLevel"];
        if (ACTIVELOGLEVEL == undefined) {
            localStorage["logLevel"] = 0;
            ACTIVELOGLEVEL = 0;
        }
    }
}

//severity levels used for log(msg, severity)
LOG_SEV_DEBUG = 3;
LOG_SEV_INFO = 2;
LOG_SEV_WARN = 1;
LOG_SEV_ERROR = 0;

var ACTIVELOGLEVEL;