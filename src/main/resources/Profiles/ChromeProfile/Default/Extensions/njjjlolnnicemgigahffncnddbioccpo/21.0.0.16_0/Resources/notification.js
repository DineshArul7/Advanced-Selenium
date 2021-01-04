
 var mylabel = document.getElementById("state");

 chrome.runtime.sendMessage({ req: "getState" }, function (response) {
     var mylabel = document.getElementById("state");

     mylabel.innerText = response.farewell;
 });                            