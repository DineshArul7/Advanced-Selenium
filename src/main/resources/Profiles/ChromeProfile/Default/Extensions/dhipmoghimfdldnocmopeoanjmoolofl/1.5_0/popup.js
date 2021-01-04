function CreateImageElement(thumbWidth, thumbHeight, oImg) {
    var nPadding = 8;

    var nScale = 1;
    if (oImg.width != 0 && oImg.height != 0) {
        if (oImg.width > oImg.height) {
            nScale = thumbWidth / oImg.width;
        } else {
            nScale = thumbHeight / oImg.height;
        }
    }
    if (nScale > 1) {
        nScale = 1; // don't scale up
    }

    var width = Math.floor(oImg.width*nScale);
    var height =  Math.floor(oImg.height*nScale);

    img = document.createElement("img");
    img.width = width;
    img.height = height;
    img.style.left = (thumbWidth + nPadding - width)/2;
    img.style.top = (thumbHeight + nPadding - height)/2;
    img.src = oImg.src;

    return img
}

// Called with a list of images from the current tab
function onImageListReceived(images) {
    var divThumbHolder = document.getElementById("thumbHolder");
    if (images != null && images.length > 0) {
        for (var src in images) {
            var oImg = images[src];
            img = CreateImageElement(48, 48, oImg);
            img.title = chrome.i18n.getMessage("edit_image");

            itemDiv = document.createElement("div");
            itemDiv.className = "selectableItem thumbnailItem";
            // Capture oImg.src
            itemDiv.onclick = function(src) {
                return function() { onImageClick(src) };
            }(oImg.src);
            divThumbHolder.appendChild(itemDiv);
            itemDiv.appendChild(img);
        }
    }
}


function onImageClick(src) {
    var img = new Image();
    img.onload = function() {
        // Create an empty canvas element
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        // Copy the image contents to the canvas
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var dataURL = canvas.toDataURL("image/png");

        chrome.extension.getBackgroundPage().LoadUrl(dataURL);
        window.close(); // close the popup
    };
    img.src = src
};

function takeScreenshot() {
    chrome.extension.getBackgroundPage().LoadScreenshot();
    window.close(); // close the popup
};

function loadImages() {
    // Do a screen capture
    chrome.tabs.captureVisibleTab(null, {format:"jpeg", quality:5}, function(dataUrl) {
        img = new Image();
        img.onload = function() {
            imgElement = CreateImageElement(168-4*2, 100-4*2, { width:img.width, height:img.width, src:dataUrl});
            imgElement.title = chrome.i18n.getMessage("edit_screenshot");
            document.getElementById('screenshotHolder').appendChild(imgElement);
        };
        img.src = dataUrl;
    });

    // Set up a listener for a one-shot notification from the script
    // we're about to inject into the active tab.
    chrome.extension.onRequest.addListener(function (images, sender, sendResponse) {
        chrome.extension.onRequest.removeListener(onImageListReceived);
        onImageListReceived(images);
    });

    // Execute a content script to build the list of images in the active tab.
    chrome.tabs.executeScript( null, { file: "image_finder.js" } );
}

function tweakWidthForScrollbar() {
    var db = document.body;
    if (db.scrollHeight > db.clientHeight) {
        db.style.paddingRight = "17px";
    } else {
        db.style.paddingRight = 0;
    }
}

function main() {
    loadImages();
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('body').addEventListener('resize', tweakWidthForScrollbar);
  document.querySelector('#screenshotHolder').addEventListener('click', takeScreenshot);
  main();
});
