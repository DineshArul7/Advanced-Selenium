function PlayListModel ($scope, type) {
	
	var ctxt = this;

	this.plId = PlayListModel.idCounter++;
	
	this.songs = []; // of type SongModel

	/* Poor man's setter. Don't set the state from outside without using this method */
	this.setState = function(value) {
		this.state = value;
		if(!$scope.$$phase)
			$scope.$apply();
	};

	this.type = type;
	if (this.type == PlayListModel.TYPE_GDRIVE)
		this.setState(PlayListModel.STATE_NOT_AUTHENTICATED);
	else if (this.type == PlayListModel.TYPE_LOCAL)
		this.setState(PlayListModel.STATE_IDLE);	
	else
		this.setState(PlayListModel.STATE_SEARCHING);



	this.clearSongs = function() {
		this.songs = [];
	};

	/* 
		@param songs - Array of SongModel objects
	*/
	this.addSongs = function(songs) {

		// dbg('PlayListModel.addSongs()');

		var N = Math.min(songs.length, getMaxLength());
		for (var i=0; i<N; i++)
		// for (var i=0, N=songs.length; i<N; i++)
			this.songs.push(songs[i]);

		$scope.mainModel.storageModel.updatePlayList(ctxt);
	};

	this.addSong = function (song) {

		// dbg('PlayListModel.addSong()');
				
		// check if exists already, no duplicates allowed
		var found = false;
		for (var i=0, len=ctxt.songs.length; i<len; i++) {
			if ( ((song.sourceType === SongModel.TYPE_LOCAL) && SongModel.localSongIsEqual(ctxt.songs[i], song)) ||
					 ((song.sourceType !== SongModel.TYPE_LOCAL) && (ctxt.songs[i].songId === song.songId)) ) {			
				found = true;
				break;
			}
		}		
		if (!found)
			ctxt.songs.push(song);

		// only store certain length of history
		if (ctxt.songs.length > getMaxLength())
		// if (ctxt.type == PlayListModel.TYPE_HISTORY && ctxt.songs.length > 100)
			ctxt.songs.splice(0, 1);

		if (ctxt.type == PlayListModel.TYPE_FAVORITES)
			song.isFavorited = true;

		$scope.mainModel.storageModel.updatePlayList(ctxt);

	};

	this.removeSong = function (song) {
		
		for (var i=0, len=ctxt.songs.length; i<len; i++) {
			if (ctxt.songs[i].songId === song.songId) {
				ctxt.songs.splice(i, 1);
				if (ctxt.type == PlayListModel.TYPE_FAVORITES)
					song.isFavorited = false;
				break;
			}
		}		
		$scope.mainModel.storageModel.updatePlayList(ctxt);
	};

	// preventing excessive amount of song data being processed
	function getMaxLength() {
		switch (ctxt.type) {
			case PlayListModel.TYPE_HISTORY:
				return 100;
			default:
				return 500;
		}
	}
};

PlayListModel.idCounter = 0;

// possible playlist types
PlayListModel.TYPE_SOUNDCLOUD = 0;
PlayListModel.TYPE_LOCAL 			= 1;
PlayListModel.TYPE_GDRIVE 		= 2;
PlayListModel.TYPE_FAVORITES 	= 3;
PlayListModel.TYPE_HISTORY 		= 4;

// possible playlist states
PlayListModel.STATE_IDLE 							= 0;
PlayListModel.STATE_SEARCHING 				= 1;
PlayListModel.STATE_FETCHING_MORE 		= 2;
PlayListModel.STATE_FAILED 						= 3;
PlayListModel.STATE_NOT_AUTHENTICATED = 4; // gdrive only
PlayListModel.STATE_AUTHENTICATING 		= 5; // gdrive only
