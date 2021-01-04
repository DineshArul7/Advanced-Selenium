/**
 * Listens for the app launching then creates the window
 *
 * @see http://developer.chrome.com/trunk/apps/app.runtime.html
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {

  chrome.app.window.create('window.html', {
		'id': 				'untilAM-ChromeApp',
		'frame': 			'none',
		'width': 			1400,
		'height': 		800,
		// screenshots
		// 'width': 1335,
		// 'height': 834,
		'minWidth': 	1280,
		'minHeight': 	684
 	});

});