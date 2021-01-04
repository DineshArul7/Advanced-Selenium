// Saves options to localStorage.
function save_options() {
    var port = document.getElementById("port");
    var logLevelSelect = document.getElementById("logLevel");
    var enableAlertAlerterCheckbox = document.getElementById("enableAlertAlerter");

    var portNumber = port.value;
    var logLevel = logLevelSelect.selectedIndex;
    var enableAlertAlerter = enableAlertAlerterCheckbox.checked;

    localStorage["port"] = portNumber;
    localStorage["logLevel"] = logLevel;
    localStorage["enableAlertAlerter"] = enableAlertAlerter;

  // Update status to let user know options were saved.
  var saveButton = document.getElementById("save");
  saveButton.innerHTML = "Saved";
  saveButton.disabled = true;
  setTimeout(function () {
      saveButton.innerHTML = "Save";
      saveButton.disabled = false;
  }, 750);
  
  document.getElementById("infoBoxDiv").style.display = "block";
}

// Restores port number to saved value from localStorage.
function restore_options() {
    var port = document.getElementById("port");
    var logLevelSelect = document.getElementById("logLevel");
    var enableAlertAlerterCheckbox = document.getElementById("enableAlertAlerter");

    var portNumber = localStorage["port"];
    var logLevel = localStorage["logLevel"];
    var enableAlertAlerter = localStorage["enableAlertAlerter"];

    if (portNumber) {
        port.value = portNumber;
    }
    if (logLevel) {
        logLevelSelect.selectedIndex = logLevel;
    }

    if (enableAlertAlerter !== undefined) {
        enableAlertAlerterCheckbox.checked = enableAlertAlerter === "true";
    }
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);