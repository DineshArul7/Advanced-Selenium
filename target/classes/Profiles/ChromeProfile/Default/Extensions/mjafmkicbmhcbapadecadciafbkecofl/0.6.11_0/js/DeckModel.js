function DeckModel($scope, $http, deckInd, audioEngine) {

	var ctxt = this;

	this.deckInd = deckInd;
	this.audioEngine = audioEngine;

	this.currentSong = null;
	this.isPlaying = false;
	this.isReadyToPlay = false;
	
	this.percentageLoaded = 0;
	
	this.vinylRenderer 	= new VinylRenderer(deckInd, $scope);
	this.songLoader 		= new SongLoader(this, $scope);

	this.turntableController = null;
	
	// faking song loading progress while actually decoding
	this.fakeUpdateInterval = null;
	this.fakeUpdateBonus = 0;

	this.resetFakeUpdate = function () {
		if (this.fakeUpdateInterval)
			clearInterval(this.fakeUpdateInterval);
		this.fakeUpdateBonus = 0;		
	};
	
	
	this.loadSong = function (song) {
		// dbg('DeckModel.loadSong(): loading ' + song.title);

		//_gaq.push(['_trackEvent', 'loadSong', song.title]);

		this.resetFakeUpdate();

		// cancel loading if already in progress
		this.songLoader.abortLoading();
	
	
		this.isReadyToPlay = false;
		this.updatePercentageLoaded(0);

		// display empty vinyl image
		ctxt.vinylRenderer.clearDeck();

		// load vinyl image
		// this.loadSongImages(song);
		// this.turntableController.loadSong(song);

		// stop currently playing
		this.audioEngine.clearDeck(this.deckInd);

		// discard old song
		if (this.currentSong) {
			this.currentSong.isOnDeck = false;
		}
		
		this.currentSong = song;
		this.currentSong.isOnDeck = true;
		$scope.songsModel.historyPL.addSong(song);

		$scope.mainModel.autoPlayerModel.reportLoading(this);

		var okToLoad = false;
		if (song.sourceType	== SongModel.TYPE_LOCAL)
		{

			// acceptable file size
			if (audioFileIsAcceptable(song.audioFile)) {
				// read the sound data into an array buffer
				var reader = new FileReader();
			  reader.onload = function(e) {
					ctxt.onSongLoaded(e.target.result);
			  };
			  reader.readAsArrayBuffer(song.audioFile);
				okToLoad = true;
			}
			// too large file --> reject
			else {
				ctxt.onSongLoadingFailed();
			}
		}
		else {
			// dbg('DeckModel.loadSong(): remote file --> downloading audio');
			if ((song.sourceType	== SongModel.TYPE_GDRIVE) && !checkFileSize(song.fileExtension, song.fileSize) ) {
				ctxt.onSongLoadingFailed();
			}
			else {
				// load audio
				this.songLoader.loadSong(song);
				okToLoad = true;
			}
		}

		// load vinyl image
		if (okToLoad) {
			this.loadSongImages(song);
			this.turntableController.loadSong(song);
		}

		if(!$scope.$$phase)
			$scope.$apply();
	};
	

	// TODO: check what happens if image loading fails
	this.loadSongImages = function(song) {

		// load vinyl image
		$http.get(song.remoteImageUrlLarge, {responseType: 'blob'}).success(function(blob) {
			blob.name = song.imageFilePathLarge; // Add image filename to blob.
			writeFile(blob);
		  song.imageUrlLarge = window.URL.createObjectURL(blob);

			// vinyl image loaded --> render onto vinyl
			ctxt.vinylRenderer.renderImage(song.imageUrlLarge);

			// load waveform image (if exists)...
			if (song.remoteWaveformImageUrl && song.remoteWaveformImageUrl.length > 0) {
				$http.get(song.remoteWaveformImageUrl, {responseType: 'blob'}).success(function(blob) {
					blob.name = song.waveformFilePath; // Add image filename to blob.
					writeFile(blob);

					// update mask image on the view level (bad mvc, I know)
					song.waveformImageUrl = window.URL.createObjectURL(blob);
					$('#waveformImageMask' + ctxt.deckInd).css('-webkit-mask-box-image', "url('" + song.waveformImageUrl + "')");
				});
			}
			// ... or remove previous waveform image mask
			else {
				$('#waveformImageMask' + ctxt.deckInd).css('-webkit-mask-box-image', "");
			}
		});
	};

	this.updatePercentageLoaded = function(newPercentage) {
		ctxt.percentageLoaded = newPercentage;
		if(!$scope.$$phase)
			$scope.$apply();
	};
	
	this.updateFakePercentageLoaded = function (percentageLoaded)
	{
		this.updatePercentageLoaded(percentageLoaded * 0.9 + this.fakeUpdateBonus);
	};
	
	this.onSongLoadingProgress = function (percentageLoaded)
	{
		this.currentSong.failed = false;
		this.updateFakePercentageLoaded(percentageLoaded);
	};

	this.onSongLoaded = function (audioArrayBuffer)
	{		
		this.audioEngine.updateAudioData(audioArrayBuffer, this.deckInd);
		this.currentSong.failed = false;
		this.updateFakePercentageLoaded(100);
		
		ctxt.fakeUpdateInterval = setInterval(function() {
			ctxt.fakeUpdateBonus += 1;
			if (ctxt.fakeUpdateBonus < 10)
				ctxt.updateFakePercentageLoaded(100);
			else
				ctxt.resetFakeUpdate();
		}, 400);		
	};
	
	this.onSongDecodingComplete = function () {
		this.resetFakeUpdate();
		this.turntableController.songProgressController.updateView();
		this.updatePercentageLoaded(100);
	};
	
	this.onSongLoadingCanceled = function () {
		// dbg('DeckModel.onSongLoadingCanceled()');
		this.resetFakeUpdate();
	};

	this.onSongLoadingFailed = function ()
	{
		onFailure();
	};
	
	this.onSongDecodingFailed = function ()
	{
		// dbg('DeckModel.onSongDecodingFailed()');
		onFailure();
	};	
	
	var onFailure = function () {
		ctxt.resetFakeUpdate();
		ctxt.updatePercentageLoaded(0);
		if (ctxt.currentSong) {
			ctxt.currentSong.failed 	= true;
			ctxt.currentSong.isOnDeck = false;
		}
		ctxt.currentSong 					= null;
		// ctxt.vinylRenderer.renderImage(null);
		// display empty vinyl image
		ctxt.vinylRenderer.clearDeck();

		// trigger bindings to refresh view: force vinyl deco update
		if(!$scope.$$phase) {
			$scope.$apply();
		}		
	};
	
};