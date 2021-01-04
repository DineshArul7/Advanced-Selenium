function WindowController($scope) {

	var win = chrome.app.window.current();
	
	$scope.isFullScreen = false;

	/////////////////////////////////////////////
	// CONTROLLER ACTIONS
	/////////////////////////////////////////////
	
	$scope.closeWindow = function () {
		win.close(); 
	};

	$scope.minimizeWindow = function () {
		if ($scope.isFullScreen)
			return;
		win.minimize(); 
	};

	$scope.maximizeWindow = function () {		
		if ($scope.isFullScreen)
			return;

		if (win.isMaximized())
			win.restore();
		else
			win.maximize(); 
	};

	$scope.toggleFullScreen = function () {
		if (win.isFullscreen())
			win.restore();
		else
		  setTimeout(win.fullscreen, 0);
	};


	/////////////////////////////////////////////
	// EVENT LISTENING
	/////////////////////////////////////////////
	
	var confirmFullScreenTransition = function () {
		updateFullScreenStatus();
		setTimeout(updateFullScreenStatus, 2000);
	};
	
	var updateFullScreenStatus = function () {
		$scope.isFullScreen = win.isFullscreen();
		if(!$scope.$$phase)
			$scope.$apply();
	};

	win.onFullscreened.addListener(confirmFullScreenTransition);
	win.onRestored.addListener(confirmFullScreenTransition);
}
