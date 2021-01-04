function buildCurrentDocumentImageList() {
    var aImgs = document.getElementsByTagName("img");
    var aImgData = [];
    var oFoundUrls = {}
    for (var i = 0; i < aImgs.length; i++) {
        var elImg = aImgs[i];

        //if (elImg.src == location.href) continue;            // disregard empty src urls
        if (elImg.width + elImg.height <= 20) continue;    // disregard silly little images
        if (elImg.src in oFoundUrls) continue;            // disregard duplicates

        var oImageData = { width:elImg.width, height:elImg.height, src:elImg.src};
        aImgData.push(oImageData);
        oFoundUrls[elImg.src] = 1;
    }

    // Sort by width*height (in reverse)
    aImgData = aImgData.sort(function(a,b) { return (b.width*b.height) - (a.width*a.height) } );
    return aImgData;
}

// Notify the extension of the images we found.
chrome.extension.sendRequest(buildCurrentDocumentImageList());

