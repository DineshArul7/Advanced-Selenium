angular.module('timeDisplayFilters', []).filter('msToStampFilter', function() {
  return function(input) {
    return input > 0 ? msToTimeString(input) : '';
  };
});

angular.module('gDriveLabelFilters', []).filter('gDriveLabelFilter', function() {
  return function(input) {	
    return input == PlayListModel.STATE_NOT_AUTHENTICATED ? 'Authenticate a Google account' : 'Refresh file listing';
  };
});

angular.module('songRowClassFilters', []).filter('songRowClassFilter', function() {
  return function(isFailed, isOnDeck, rowType) {	
		var rv = rowType == 0 ? 'songRow' : 'songRowEven';

		if (isFailed)
			rv += ' songRowFailed';
		else if (isOnDeck)
			rv += ' songRowOnDeck';

		return rv;
  };
});


angular.module('searchFilters', []).filter('searchStateFilter', function() {
  return function(searchStatus, songsCount, currentPlayList) {

		// dbg('filter: status = ' + searchStatus + ', songs count = ' + songsCount + ', cur pl = ' + currentPlayList);

		if (currentPlayList == null)
			return '';

		// soundcloud search
		if (currentPlayList == PlayListModel.TYPE_SOUNDCLOUD) {
			switch (searchStatus)
			{
				case PlayListModel.STATE_SEARCHING:
					return 'Searching SoundCloud, please wait...';

				case PlayListModel.STATE_IDLE:
					return songsCount > 0 ? '' : 'No songs found. Try a different search!';

				case PlayListModel.STATE_FAILED:
					return 'Could not connect to SoundCloud. Check your internet connection!';	

				default:
					return '';
			}
		}

		// local songs
		else if (currentPlayList == PlayListModel.TYPE_LOCAL) {
			switch (searchStatus)
			{
				case PlayListModel.STATE_SEARCHING:
					return 'Opening file...';

				case PlayListModel.STATE_IDLE:
					return songsCount > 0 ? '' : 'Click the Browse button above to locate your local .mp3, .wav and .ogg files';

				case PlayListModel.STATE_FAILED:
					return 'Error opening the local file.';	

				default:
					return '';
			}
		}

		// gdrive songs
		else if (currentPlayList == PlayListModel.TYPE_GDRIVE) {
			switch (searchStatus)
			{
				case PlayListModel.STATE_SEARCHING:
					return 'Reading from Google Drive...';

					case PlayListModel.STATE_AUTHENTICATING:
						return 'After finishing the authentication in another window, click the button above again to refresh the file listing.';

				case PlayListModel.STATE_NOT_AUTHENTICATED:
					return 'Click the Authenticate button above to connect to Google Drive. After finishing the authentication in another window, return to the app.';

				case PlayListModel.STATE_IDLE:
					return songsCount > 0 ? '' : 'No audio files were found on your Google Drive. The supported formats are .mp3, .wav and .ogg.';

				case PlayListModel.STATE_FAILED:
					return 'Could not connect to Google Drive. Check your internet connection!';

				default:
					return '';
			}
		}

		else if (currentPlayList == PlayListModel.TYPE_FAVORITES) {
			switch (searchStatus)
			{
				case PlayListModel.STATE_SEARCHING:
					return 'Loading from SoundCloud...';

				case PlayListModel.STATE_IDLE:
					return songsCount > 0 ? '' : 'You haven\'t favorited any songs. Add songs to favorites by clicking the star symbol next to the song name.';

				case PlayListModel.STATE_FAILED:
					return 'Error loading the files.';	

				default:
					return '';
			}
		}

		else if (currentPlayList == PlayListModel.TYPE_HISTORY) {
			switch (searchStatus)
			{
				case PlayListModel.STATE_SEARCHING:
					return 'Loading from SoundCloud...';

				case PlayListModel.STATE_IDLE:
					return songsCount > 0 ? '' : 'There is no playback history. Drag songs onto the decks to get started!';

				case PlayListModel.STATE_FAILED:
					return 'Error loading the files.';	

				default:
					return '';
			}
		}


		else {
			dbg('searchStateFilter: illegal playlist type = ' + currentPlayList);
			return '';
		}

  };
});

angular.module('deckFilters', []).filter('speedLabelFilter', function() {
  return function(input) {

		// initially show the 'SPEED' label
		if (!input)
			return 'SPEED';

		// after the user has touched the slider, display the current value 
		// (with a little bit of extra formatting)
		var rv = input > 0 ? 0 - input : '+' + Math.abs(input);
		if ( Math.abs(input) == Math.round(Math.abs(input)) )
			rv += '.0';
		return rv + '%';
  };
});



