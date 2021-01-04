// FILESYSTEM SUPPORT ----------------------------------------------------------

var fs = null;
var FOLDERNAME = 'untilam_cache';

// Init setup and attach event listeners.
document.addEventListener('DOMContentLoaded', function(e) {
	// 1024 * 1024 = 1 MB
  window.webkitRequestFileSystem(TEMPORARY, 1024 * 1024, function(localFs) {
    fs = localFs;
  }, onError);
});

function onFileError(e)
{
	dbg('****WARNING: onFileError(): e = ' + e);
}


function writeFile(theBlob) {
  if (!fs)
    return;

  fs.root.getDirectory(FOLDERNAME, {create: true}, function(dirEntry) {
	  dirEntry.getFile(theBlob.name, {create: true, exclusive: false}, function(fileEntry) {
      // Create a FileWriter object for our FileEntry, and write out blob.
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onFileError = onError;
        fileWriter.onwriteend = function(e) {};
        fileWriter.write(theBlob);
      }, onFileError);
    }, onFileError);
  }, onFileError);
}

function getFileExtension(file) {
	return file ? file.name.split('.').pop().toLowerCase() : null;
}

function audioFileIsAcceptable(file) {
	return checkFileSize(getFileExtension(file), file.size);
}

/*
	The boundary file sizes below are more or less arbitrary. The idea is to prevent too long audio files (mixtapes) to 
	be loaded into the memory. It's too late to check for file size after decoding, so these numbers provide a trick to 
	estimate whether the raw data would crash the app.
*/
function checkFileSize(fileExtension, fileSize) {
	switch (fileExtension) {
		case 'mp3':
			return fileSize < 18 * 1000000;
		case 'wav':
			return fileSize < 72 * 1000000;
		case 'ogg':
			return fileSize < 16 * 1000000;
		default:
			dbg('*** WARNING: unknown file extension = ' + getFileExtension(file));
			return false;
	}	
}


