function SongsController($scope, $http) {

	var ctxt = this;
	
	this.soundCloudSongSource = new SoundCloudSongSourceModel($scope, $http);
	this.searchModel 					= new SearchModel($scope, this.soundCloudSongSource);
	this.songPreloader 				= new SongPreloader($scope, this.searchModel, this.soundCloudSongSource);
	this.searchModel.songPreloader = this.songPreloader;

	/*
	* Initialization routines.
	*/
	var initSongsList = function () {
		
		// start preloading songs (favorites and recents)
		ctxt.songPreloader.begin();

		// detect when the search box gains / looses focus 
		// --> disable/enable keyboard shortcuts (to allow writing text without triggering special commands)
		var $searchInput = $('.searchInput');

		var onWindowClick = function (event) {
			window.removeEventListener('mousedown', onWindowClick, false);
			$searchInput.blur();
		};
		
		$searchInput.focus(function() {
			$scope.keyboardController.disableKeyboard();
			window.addEventListener('mousedown', onWindowClick, false);
		});

		$searchInput.focusout(function() {
			$scope.keyboardController.enableKeyboard();
		});
	};

	$scope.getSongRowClass = function(failed, isOnDeck, rowIndex) {
		var rv = rowIndex%2==0 ? 'songRowEven' : 'songRow';

		if (failed)
			rv += ' songRowFailed';
		else if (isOnDeck)
			rv += ' songRowOnDeck';

		return rv;
	};

	/*
	*	Searching SoundCloud.
	*/

	$scope.onSearchButtonClick = function() {
		ctxt.searchModel.newSearch($scope.searchText);
	};

	$scope.onNextPageButtonClick = function() {
		if ($scope.nextAllowed)
			ctxt.searchModel.nextPage();
	};

	$scope.onPreviousPageButtonClick = function() {
		if ($scope.previousAllowed)
			ctxt.searchModel.previousPage();
	};


	/*
		Changing the song source = clicking a tab
	*/
	$scope.onTabClick = function (tabIndex) {
		$scope.songsModel.choosePlayList(tabIndex);
	};

	$scope.downloadSong = function (song) {
		// dbg('downloadSong(): song = ' + song.title);
	};


	$scope.toggleFavorite = function (song) {
		if (song.isFavorited) {
			$scope.songsModel.favoritesPL.removeSong(song);
			$scope.songsModel.updateSongsList(true);
		}
		else
			$scope.songsModel.favoritesPL.addSong(song);
		
		if(!$scope.$$phase)
			$scope.$apply();
	};


	/*
		Invoked when the user has selected a file with the file browser.
	*/
	$scope.openLocalFiles = function(files)
	{
		var songs = [];
		var song;
		
		for (var i=0, N=files.length; i<N; i++) {
			// create a song model object and store the file reference for extracting later
			song = $scope.songParser.parseLocalSong(files[i]);
			if (song) {
				songs.push(song);
				// _gaq.push(['_trackEvent', 'openLocalFile', getFileExtension(song.audioFile)]);
			}
		}
		
		// add to the list of local songs
		if (songs.length > 0) {
			$scope.songsModel.localPL.addSongs(songs);
			$scope.songsModel.updateSongsList();
		}
	};


	initSongsList();
};