function SongParser($scope, $http) {

	// paths to default assets
	var imageDir 										= isHiRes() ? 'img/2x/' : 'img/default/';
	var defaultLabelImageNameSmall 	= 'defaultLabelImageSmall.png';
	var defaultLabelImageNameLarge 	= 'defaultLabelImageLarge.png';
	var defaultWaveFormImageName 		= 'defaultWaveform.png';

	var songsModel = $scope.songsModel;


	//////////////////////////////////////////////////////////
	// public parsing methods: data to SongModel objects
	//////////////////////////////////////////////////////////

	this.parseSoundCloudSong = function (songData) {

		// check if this song exists already to avoid duplicate objects
		var song = findParsedSong(songData.id, SongModel.TYPE_SOUNDCLOUD);
		if (song) {
			return song;
		}

		var mp3DownloadUrl = songData.download_url;
		var mp3StreamUrl 	 = songData.stream_url;
		mp3DownloadUrl = mp3DownloadUrl ? mp3DownloadUrl + "?client_id=" + Config.soundCloudClientId : null;
		mp3StreamUrl	 = mp3StreamUrl ? mp3StreamUrl + "?client_id=" + Config.soundCloudClientId: null;

		// Strangely enough, some SoundCloud songs might miss both stream and download urls. We'll ignore these.
		if (!mp3DownloadUrl && !mp3StreamUrl) {
			return null;
		}
		
		// Sometimes the SoundCloud API also returns songs that are too long. Ingnore these as well.
		if (songData.duration > 8 * 60000) {
			return null;
		}

		var imageUrlSmall = songData.artwork_url;
		if (!imageUrlSmall || imageUrlSmall.length < 1)
			imageUrlSmall = imageDir + defaultLabelImageNameSmall;
		else
			imageUrlSmall = imageUrlSmall.replace("large", "badge");

		var imageUrlLarge = songData.artwork_url;
		if (!imageUrlLarge || imageUrlLarge.length < 1)
			imageUrlLarge = imageDir + defaultLabelImageNameLarge;
		else
			imageUrlLarge = imageUrlLarge.replace("large", "t300x300");

	  var imageFilePathSmall = imageUrlSmall.substring(imageUrlSmall.lastIndexOf('/') + 1).split('?')[0];
		var imageFilePathLarge = imageUrlLarge.substring(imageUrlLarge.lastIndexOf('/') + 1).split('?')[0];


		song = new SongModel();

		song.songId 							= songData.id;
		song.title 								= songData.title; 
		song.authorName 					= songData.user.username;
		song.duration 						= songData.duration;
		song.remoteImageUrlSmall 	= imageUrlSmall;
		song.remoteImageUrlLarge 	= imageUrlLarge;
		song.imageFilePathSmall 	= imageFilePathSmall;
		song.imageFilePathLarge 	= imageFilePathLarge;
		song.mp3DownloadUrl 			= mp3DownloadUrl;
		song.mp3StreamUrl 				= mp3StreamUrl;
		song.remoteWaveformImageUrl = songData.waveform_url;
		song.waveformFilePath 			= songData.waveform_url.substring(songData.waveform_url.lastIndexOf('/') + 1).split('?')[0];
		song.sourceType = SongModel.TYPE_SOUNDCLOUD;

		if (mp3DownloadUrl && mp3DownloadUrl.length > 0)
			song.isDownloadable	= true;

		loadThumbnail(song);

		return song;
	};

	this.parseLocalSong = function (file) {

		// dbg('parseLocalSong(): filename = ' + file.name);

		var song = new SongModel();

		song.title 									= fileNameToSongTitle(file.name);
		song.remoteImageUrlSmall		= imageDir + defaultLabelImageNameSmall;
		song.remoteImageUrlLarge 		= imageDir + defaultLabelImageNameLarge;
		song.imageFilePathSmall 		= defaultLabelImageNameSmall;
		song.imageFilePathLarge 		= defaultLabelImageNameLarge;
		song.audioFile 							= file;
		song.fileSize 					  	= file.size;
		song.fileName 					  	= file.name;
		song.remoteWaveformImageUrl = imageDir + defaultWaveFormImageName;
		song.waveformFilePath 			= defaultWaveFormImageName;
		song.sourceType							= SongModel.TYPE_LOCAL;
		
		loadThumbnail(song);
		
		return song;
	};

	this.parseGoogleDriveSong = function (fileId, fileName, fileUrl, fileSize, fileExtension) {

		// check if this song exists already to avoid duplicate objects
		var song = findParsedSong(fileId, SongModel.TYPE_GDRIVE);
		if (song)
			return song;

		var song = new SongModel();

		song.songId 								= fileId;
		song.title									= fileNameToSongTitle(fileName);
		song.remoteImageUrlSmall 		= imageDir + defaultLabelImageNameSmall;
		song.remoteImageUrlLarge 		= imageDir + defaultLabelImageNameLarge;
		song.imageFilePathSmall 		= defaultLabelImageNameSmall;
		song.imageFilePathLarge 		= defaultLabelImageNameLarge;
		song.mp3DownloadUrl 				= fileUrl;
		song.mp3StreamUrl 					= fileUrl;
		song.sourceType 						= SongModel.TYPE_GDRIVE;
		song.fileSize 					  	= fileSize;
		song.fileExtension					= fileExtension;
		song.remoteWaveformImageUrl = imageDir + defaultWaveFormImageName;
		song.waveformFilePath 			= defaultWaveFormImageName;

		loadThumbnail(song);

		return song;
	};


	//////////////////////////////////////////////////////////
	// internal helper methods
	//////////////////////////////////////////////////////////
	
	/*
	* Tries to find a song with given id from amongts the already parsed songs. This is necessary to avoid duplicates 
	* of the same song on various playlists, for example search results and favorites. This way, the same object is kept 
	* on several lists and e.g. play status is updated on all of them.
	* 
	* @param songId: 		The SoundCloud id or Google Drive id of the song to look for.
	* @param songType: 	Source type of the song, one of the constants defined in SongModel
	*/
	var findParsedSong = function (songId, songType) {

		// dbg('findParsedSong(' + songId + ', ' + songType + ')');
		var playLists = [];

		// soundcloud songs can be found on search results, favorites or history
		if (songType === SongModel.TYPE_SOUNDCLOUD) {
			playLists.push(songsModel.searchResultPL);
			playLists.push(songsModel.favoritesPL);
			playLists.push(songsModel.historyPL);
		}

		// google drive songs can be found on gdrive songs list or history
		else {
			playLists.push(songsModel.gDrivePL);
			playLists.push(songsModel.historyPL);
		}

		// compare to songs on playlists
		var pl;
		var song;
		for (var i = 0; i<playLists.length; i++)
		{
			pl = playLists[i];
			for (var j = 0; j<pl.songs.length; j++)
			{
				song = pl.songs[j];
				if ((song.songId === songId) && (song.sourceType === songType))
					return song;
			}
		}
		
		// compare to songs on decks
		song = $scope.mainModel.deck0.currentSong;
		if (song && song.songId == songId)
			return song;

		song = $scope.mainModel.deck1.currentSong;
		if (song && song.songId == songId)
			return song;

		// not found
		return null;
	};

	var fileNameToSongTitle = function (fileName) {
		return fileName.split('.mp3')[0].split('.MP3')[0].split('.wav')[0].split('.WAV')[0].split('.ogg')[0].split('.OGG')[0];
	};

  var loadThumbnail = function(song) {
		// console.log('SongParser.loadThumbnail(): loading from ' + song.remoteImageUrlSmall);
		$http.get(song.remoteImageUrlSmall, {responseType: 'blob'}).success(function(blob) {
      blob.name = song.imageFilePathSmall; // Add thumbnail filename to blob.
      writeFile(blob); 										 // Write is async, but that's ok.
      song.imageUrlSmall = window.URL.createObjectURL(blob);
    }).error(function(resp, status, headers, config) {
			// console.log('***WARNING: SongParser.loadThumbnail(): failed to load for song ' + song.title);
			// couldn't load the thumbnail for some reason --> load the default image instead
			song.remoteImageUrlSmall = imageDir + defaultLabelImageNameSmall;
			song.remoteImageUrlLarge = imageDir + defaultLabelImageNameLarge;
			loadThumbnail(song);
		});
	};


	//
	// Requires some work: doesn't read the info properly (only partial strings)
	//
	// this.parseID3 = function (song, file, callback) {
	// 	
	// 	if ((file.name.indexOf('.mp3') > 0) || (file.name.indexOf('.MP3') > 0))
	// 	{
	// 		dbg('parsing mp3 info');
	// 		
	// 	  var reader = new FileReader();
	// 	  reader.onload = function(e) {
	// 
	// 			dbg('reader.onload');
	// 
	// 			var title  = '';
	// 			var author = '';
	// 	    var dv = new jDataView(this.result);
	// 
	// 	    // "TAG" starts at byte -128 from EOF.
	// 	    // See http://en.wikipedia.org/wiki/ID3
	// 	    if (dv.getString(3, dv.byteLength - 128) == 'TAG') {
	// 				title = dv.getString(40, dv.tell());
	// 	      author = dv.getString(30, dv.tell());
	// 	      // var album = dv.getString(30, dv.tell());
	// 	      // var year = dv.getString(4, dv.tell());	
	// 	    } else {
	// 	      // no ID3v1 data found.
	// 				// song.title = fileNameToSongTitle(file.name);
	// 	    }
	// 
	// 			dbg('id3 parsed, title = ' + title + ', author = ' + author);
	// 			song.title 			= title.length > 0 ? title : fileNameToSongTitle(file.name);
	// 			song.authorName = author.length > 0 ? author : '';
	// 
	// 			dbg('song.title = ' + song.title);
	// 			dbg('default = ' + fileNameToSongTitle(file.name));
	// 			callback();
	// 	  };
	// 
	// 	  reader.readAsArrayBuffer(file);			
	// 	}
	// 	else {			
	// 		dbg('not an mp3 file');
	// 		song.title = fileNameToSongTitle(file.name);		
	// 		callback();
	// 	}		
	// };
}