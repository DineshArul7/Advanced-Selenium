function SongModel () {
	this.songId 							= -1;	// soundcloud id or gdrive id, not set for local songs
	this.title 								= '';
	this.authorName						= '';
	this.duration							= 0;
	this.imageUrlSmall				= '';
	this.imageUrlLarge				= '';
	this.imageFilePathSmall		= '';
	this.imageFilePathLarge		= '';
	this.mp3DownloadUrl				= '';
	this.mp3StreamUrl					= '';
	this.waveformImageUrl			= '';
	this.waveformFilePath			= '';
	this._isOnDeck 						= false;
	this._failed							= false;
	this.isFavorited 					= false;
	this.audioFile						= null;	
	this.fileSize							= -1;
	this.fileName							= null;
	this.sourceType 					= -1;			// soundcloud, local or gdrive
	this.isDownloadable				= false;
	this.status 							= SongModel.STATUS_BASIC;

	this.updateStatus = function () {
		if (this._failed)
			this.status = SongModel.STATUS_FAILED;
		else if (this._isOnDeck)
			this.status = SongModel.STATUS_ON_DECK;
		else
			this.status = SongModel.STATUS_BASIC;		
	};
}

SongModel.prototype = {

	get isOnDeck() {
		return this._isOnDeck;
	},
	set isOnDeck(value) {
		this._isOnDeck = value;
		this.updateStatus();
	},

	get failed() {
		return this._failed;
	},
	set failed(value) {
		this._failed = value;
		this.updateStatus();
	}	
};

SongModel.localSongIsEqual = function (song, otherSong) {
	return (song.sourceType === SongModel.TYPE_LOCAL) && (otherSong.sourceType === SongModel.TYPE_LOCAL) && 
					(song.fileName) && (song.fileName.length > 0) && 
					(song.fileName === otherSong.fileName) && 
					(song.fileSize === otherSong.fileSize);
};


SongModel.STATUS_FAILED 	= 0; // loading or audio data extration failed
SongModel.STATUS_ON_DECK 	= 1; // currently on one of the decks
SongModel.STATUS_BASIC 		= 2; // ready to be selected for playback

SongModel.TYPE_SOUNDCLOUD = 0;
SongModel.TYPE_LOCAL 			= 1;
SongModel.TYPE_GDRIVE 		= 2;