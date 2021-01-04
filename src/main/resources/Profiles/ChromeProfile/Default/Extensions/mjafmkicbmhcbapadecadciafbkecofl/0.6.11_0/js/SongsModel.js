function SongsModel($scope) {

	var ctxt = this;

	// this.currentPlayListType = 0;
	
	this.currentPlayList = null;
	
	this.searchResultPL 	= new PlayListModel($scope, PlayListModel.TYPE_SOUNDCLOUD);
	this.localPL 					= new PlayListModel($scope, PlayListModel.TYPE_LOCAL);
	this.gDrivePL 				= new PlayListModel($scope, PlayListModel.TYPE_GDRIVE);
	this.favoritesPL 			= new PlayListModel($scope, PlayListModel.TYPE_FAVORITES);
	this.historyPL 				= new PlayListModel($scope, PlayListModel.TYPE_HISTORY);

	var currentlyChanging = false;
	var songsListHidden = false;

	this.displayedSongs = [];

	this.hideSongsList = function (callback) {
		// dbg('hideSongsList()');

		if (songsListHidden) {
			// dbg('hideSongsList(): allready hidden --> callback');
			callback && callback();			
		}
		else {
			songsListHidden	= true;
			// dbg('fade out');
			// $('.songRowsWrapper').hide(100);
			$('.songRowsWrapper').css('visibility', 'hidden');
			// $('.songRowsWrapper').fadeTo(100, 0);
			setTimeout(function() {
				// dbg('hideSongsList(): callback');
				callback && callback();
			}, 120);
		}
	};

	var queuedUpdate = false;

	this.updateSongsList = function (skipFade) {
		// dbg('updateSongsList(' + skipFade + '): current pl = ' + ctxt.currentPlayList.type);

		// If currently manipulating the displayed songs list, do nothing but set the flag so another update 
		// takes place after the current one. This hardly ever happens after the startup, so not really a problem 
		// if it takes a while to update twice.
		if (currentlyChanging) {
			// dbg('already updating --> queue');
			queuedUpdate = true;
			return;
		}
		currentlyChanging = true;
		var songsPerTimer = 12;
		var timerStepDuration = 60;
	
		var removeLastSongs = function() {

				// dbg('removeLastSong(): remaining = ' + ctxt.displayedSongs.length);
				// all removed already
				if (ctxt.displayedSongs.length < 1) {
					addNewSongs();
				}
				
				// or remove some
				else {
					ctxt.displayedSongs.splice(-songsPerTimer - 1, songsPerTimer);

					// refresh view
					if(!$scope.$$phase) {
						$scope.$apply();
					}

					// and remove more after a while
					setTimeout(removeLastSongs, timerStepDuration);
				}
		};

		var addNewSongs = function () {

			if (ctxt.currentPlayList.songs.length === 0)
				onUpdatingDone();
			else {
				var addingSongIndex = 0;
				var newSongs = ctxt.currentPlayList.songs;
				var i, j;
				var N = Math.ceil(newSongs.length / songsPerTimer);

				for (i = 0; i<N; i++)
				{
					setTimeout(function () {

						for (j=0; j<songsPerTimer; j++) {
							if (addingSongIndex < newSongs.length) {
								// dbg('adding song ' + j + ' [' + addingSongIndex + '] = ' + newSongs[addingSongIndex].title);
								ctxt.displayedSongs.push(newSongs[addingSongIndex]);
								addingSongIndex++;
							}
						}

						// refresh view
						if(!$scope.$$phase)
							$scope.$apply();

						// dbg('addNewSongs(): added ' + addingSongIndex + ' out of ' + newSongs.length);
						if (addingSongIndex >= newSongs.length) {
							onUpdatingDone();
						}

					}, timerStepDuration * i);
				}				
			}
		};
		
		var onUpdatingDone = function () {

			if (queuedUpdate) {
				// dbg('onUpdatingDone(): queued update');
				queuedUpdate = false;
				removeLastSongs();
			}
			else {
				// dbg('onUpdatingDone(): NOT queued');
				$('.songRowsWrapper').animate({scrollTop: 0}, 0);

				setTimeout(function () {

					if (queuedUpdate) {
						// dbg('onUpdatingDone(): after timeout queued update');
						queuedUpdate = false;
						removeLastSongs();
					}
					else {
						// $('.songRowsWrapper').css('visibility', 'visible');
						currentlyChanging = false;
						songsListHidden	= false;

						// dbg('onUpdatingDone(): change allowed again, # of songs = ' + ctxt.displayedSongs.length);
						
						// Ugly hack: before displaying the songs list again, quickly change the margin of the favorite button twice.
						// This forces rerendering of the list and fixes a strange bug, which sometimes causes the first element in 
						// the list to display the margin improperly. This has probably something to do with the Angular bindings, 
						// the scrollbar of the list and rendering order.
						setTimeout(function () {
							$('.favoriteButton').css('margin-right', '16px');
							setTimeout(function () {
								$('.favoriteButton').css('margin-right', '6px');
								$('.songRowsWrapper').css('visibility', 'visible');
							}, 10);
						}, 10);
					}
				}, 10);
			}
		};
			// dbg('updateSongsList(): starting updating: current pl = ' + ctxt.currentPlayList.type);
		removeLastSongs();
	};

	this.choosePlayList = function (playListType) {

		if (currentlyChanging) {
			// dbg('choosePlayList(' + playListType + '): updating --> not changing');
			return;
		}

		if (ctxt.currentPlayList && playListType === ctxt.currentPlayList.type) {
			// dbg('already showing pl of type ' + playListType);
			return;
		}

		// dbg('choosePlayList(' + playListType + '): choosing normally');

		switch (playListType)
		{
			case PlayListModel.TYPE_SOUNDCLOUD:
				ctxt.currentPlayList = ctxt.searchResultPL;
				break;

			case PlayListModel.TYPE_LOCAL:
				ctxt.currentPlayList = ctxt.localPL;
				break;

			case PlayListModel.TYPE_GDRIVE:
				ctxt.currentPlayList = ctxt.gDrivePL;
				break;

			case PlayListModel.TYPE_FAVORITES:
				ctxt.currentPlayList = ctxt.favoritesPL;
				break;

			case PlayListModel.TYPE_HISTORY:
				ctxt.currentPlayList = ctxt.historyPL;
				break;

			default:
				dbg('*** WARNING: choosePlayList(): unknown playlist type = ' + playListType);
		}

		this.hideSongsList(function() {
			ctxt.updateSongsList();
		});
	};
	
	// begin with the SoundCloud tab
	this.choosePlayList(PlayListModel.TYPE_SOUNDCLOUD);
};
