function GoogleDriveModel ($scope, $http) {
	
	var ctxt = this;
	
	this.accessToken = null;
	
  var gdocs = new GDocs();
	var playList = $scope.songsModel.gDrivePL;

	this.refreshSongs = function (interactiveAuthentication) {
		// clear old songs
		playList.setState(PlayListModel.STATE_SEARCHING);
		$scope.songsModel.hideSongsList(function () {
			playList.clearSongs();

			// authenticate if not done already
			if (!ctxt.accessToken) {

				playList.setState(PlayListModel.STATE_AUTHENTICATING);
			  gdocs.auth(interactiveAuthentication,
					// authentication succesful
					function() {
						// dbg('GoogleDriveModel.refreshSongs(): authentication succesful');
				    ctxt.accessToken = gdocs.accessToken;
				    fetchDocs();
				  },
					// user not authenticated
					function() {
						// dbg('GoogleDriveModel.refreshSongs(): not authenticated');
						playList.setState(PlayListModel.STATE_NOT_AUTHENTICATED);
						$scope.songsModel.updateSongsList();
					},
					// authentication attempt failed
					function() {
						// dbg('GoogleDriveModel.refreshSongs(): auth failed');
						playList.setState(PlayListModel.STATE_NOT_AUTHENTICATED);
						$scope.songsModel.updateSongsList();
					}
				);
			}
			// authentication done already, just fetch the data
			else {
		    fetchDocs();
			}
			
		});

	};

	/*
		Fetch the documents from Google Drive. At this point, the authentication must be complete already.
	*/
	var fetchDocs = function () {
		playList.setState(PlayListModel.STATE_SEARCHING);

		var config = 	{	params: {'alt': 'json'},
		  							headers: {
											'Authorization': 'Bearer ' + ctxt.accessToken,
											'GData-Version': '3.0'
										}};
    $http.get(gdocs.DOCLIST_FEED, config).success(onDocsLoaded).error(errorCallBack);

		// this seems to be necessary to kick the http request above, no idea why
		if(!$scope.$$phase) {
			$scope.$apply();
		}
	};

	var errorCallBack = function(resp, status, headers, config) {
		dbg('***WARNING: loading from Google Drive failed');
		playList.setState(PlayListModel.STATE_FAILED);
		$scope.songsModel.updateSongsList();
		// playList.searchIsOver();
	};


	/*
		Data from Google Drive retrieved. Parse into song models and add to playlist.
	*/
	var onDocsLoaded = function (resp, status, headers, config) {

		// parse the new songs
		var entry;
		var songs = [];

		// limit the amount of files to add: Google Drive might contain any number of songs
		var maxSongs = 100; 
		var validSongsCount = 0;
		
		// ensure there're some files in the listing
		if (resp && resp.feed && resp.feed.entry) {

			// ... then loop through them
			for (var i=0; i<resp.feed.entry.length && validSongsCount < maxSongs; i++) {
				entry = resp.feed.entry[i];

				// ignore other than audio files
				var type = entry.content.type;
				var fileExtension;
				switch (type) {
					case 'application/ogg':
						fileExtension = 'ogg';
						break;

					case 'audio/x-wav':
						fileExtension = 'wav';
						break;

					case 'audio/mpeg':
						fileExtension = 'mp3';
						break;

					// not audio or unsupported format
					default: 
						continue;
				}

				var song = $scope.songParser.parseGoogleDriveSong(entry.id.$t, entry.title.$t, entry.content.src, entry.docs$size.$t, fileExtension);
				if (song) {
					songs.push(song);
					validSongsCount++;
				}
			}
		}

		// parsing done
		playList.addSongs(songs);
		playList.setState(PlayListModel.STATE_IDLE);

		// update songs list only if currently displaying the gdrive songs
		if ($scope.songsModel.currentPlayList.type === PlayListModel.TYPE_GDRIVE)
			$scope.songsModel.updateSongsList();
	};
	
}