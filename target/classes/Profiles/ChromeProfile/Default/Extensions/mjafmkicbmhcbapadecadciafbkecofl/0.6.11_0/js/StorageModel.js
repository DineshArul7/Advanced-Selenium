function StorageModel() {

	var ctxt = this;
  var storage = chrome.storage.sync;
	var playListKey = 'playList_';
	var isUpdating = false;

	/**
	 * No updating before this method gets called. This should be invoked after the initial 
	 * loading of the previously cached data is complete.
	 * */
	this.startUpdating = function()
	{
		isUpdating = true;
	};

	
	this.updatePlayList = function (thePlayList) {

		if (!isUpdating)
			return;

		if (thePlayList.type !== PlayListModel.TYPE_FAVORITES && 
				thePlayList.type !== PlayListModel.TYPE_HISTORY) {
			return;
		}

		var ids = [];
		var theSong;
		for (var i=0, len = thePlayList.songs.length; i<len; i++)
		{
			// skip local songs
			theSong = thePlayList.songs[i];
			if (theSong.sourceType == SongModel.TYPE_SOUNDCLOUD) {
				ids.push(theSong.songId);
			}
		}

		var stored = {};
		stored[playListKey + thePlayList.plId] = ids;

		storage.set(stored, function () {
			// dbg('stored info for playlist ' + thePlayList.plId + ': ' + ids);			
			// storage.getBytesInUse(null, function(bytesInUse) {
			// 	dbg('bytes in use = ' + bytesInUse);
			// });			
		});
	};

	this.getPlayListIds = function (playListId, callback) {
		var key = playListKey + playListId;
		storage.get(key, function (storedObj) {
			var ids;
			if (storedObj)
				ids = storedObj[key];
			// dbg('retrieved info for playlist ' + playListId + ': ' + ids);
			if (!ids)
				ids = [];
			callback && callback(ids);
		});
	};
}