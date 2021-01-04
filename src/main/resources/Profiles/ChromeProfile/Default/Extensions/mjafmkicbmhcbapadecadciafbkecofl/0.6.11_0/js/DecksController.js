function DecksController($scope) {
	
	var ctxt = this;
	
	// $scope.gain0 	= 0.2;
	// $scope.gain1 	= 0.2;
	// $scope.playHeadSlider0 = 0;
	// $scope.playHeadSlider1 = 0;

	$scope.currentPlayHeadTime0 = 0;
	$scope.currentPlayHeadTime1 = 0;
	
	// $scope.turntableController0 = new TurntableController($scope, $scope.mainModel.deck0, $scope.mainModel.audioEngine);
	// $scope.turntableController1 = new TurntableController($scope, $scope.mainModel.deck1, $scope.mainModel.audioEngine);
	// 
	// // TODO: fix this scope mess here: define the generally needed properties in the parent scope
	// $scope.mainModel.audioEngine.sampler0.turntableController = $scope.turntableController0;
	// $scope.mainModel.audioEngine.sampler0.deckModel = $scope.mainModel.deck0;
	// $scope.mainModel.deck0.turntableController = $scope.turntableController0;
	// 
	// $scope.mainModel.audioEngine.sampler1.turntableController = $scope.turntableController1;
	// $scope.mainModel.audioEngine.sampler1.deckModel = $scope.mainModel.deck1;
	// $scope.mainModel.deck1.turntableController = $scope.turntableController1;
			

	$scope.fxPadController0 = new FxPadController($scope, 0, $scope.mainModel.audioEngine);
	$scope.fxPadController1 = new FxPadController($scope, 1, $scope.mainModel.audioEngine);		
	
	////////////////////////////////////
	// playback 
	////////////////////////////////////
	
	// $scope.togglePlay = function(deckInd) {	
	// 	var deck = deckInd == 0 ? $scope.mainModel.deck0 : $scope.mainModel.deck1;
	// 	
	// 	if (deck.isReadyToPlay) {
	// 		deck.isPlaying = !deck.isPlaying;
	// 		$scope['turntableController' + deckInd].onPlayChange(deck.isPlaying);			
	// 	}		
	// };

	$scope.onSpeedChange = function(deckInd) {
		$scope['turntableController' + deckInd].updateSpeed(-1 * this['turntableController' + deckInd].speed);
	};

	$scope.onPlayHeadSliderChange = function(deckInd)
	{
		$scope['turntableController' + deckInd].songProgressController.onPlayHeadSliderChange($scope['playHeadSlider' + deckInd]);
	};


	$scope.onTimeDisplayClick = function(deckInd)
	{
		$scope['turntableController' + deckInd].songProgressController.toggleDisplayMode();
	};

	// ////////////////////////////////////
	// // channel gains and crossfader
	// ////////////////////////////////////
	
	// $scope.onGainChange = function(deckInd) {
	// 	ctxt.updateGain();
	// };
	// 
	// $scope.onCrossFaderChange = function() {
	// 	ctxt.updateGain();
	// };
	// 
	// this.updateGain = function()
	// {		
	// 	var vol0 = 1.0 - $scope.gain0;
	// 	var vol1 = 1.0 - $scope.gain1;
	// 	var cf   = $scope.crossFader;
	// 
	// 	$scope.mainModel.audioEngine.setGain(vol0 * (1 - cf), 0);		
	// 	$scope.mainModel.audioEngine.setGain(vol1 * cf, 1);		
	// };

	////////////////////////////////////
	// fx
	////////////////////////////////////

	$scope.nextEffect = function(deckInd) {
		$scope['fxPadController' + deckInd].nextEffect();
	};

	$scope.resetEffects = function(deckInd) {
		$scope['fxPadController' + deckInd].resetEffects();
	};


	////////////////////////////////////////////
	// updating the display (rotating vinyls)
	////////////////////////////////////////////
	
  // var requestAnimationFrame = window.webkitRequestAnimationFrame;
	
	var requestAnimationFrame = (function(callback) {
		return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
	  	function(callback) {
	    	window.setTimeout(callback, 1000 / 60);
			};
		})();
	
	
	function draw() {
		setTimeout(function() {
			requestAnimationFrame(draw);

			$scope.turntableController0.onEnterFrame();
			$scope.turntableController1.onEnterFrame();

			$scope.keyboardController.onEnterFrame();

		}, 40); // 40 = 1000 / 25 --> 25fps
			// }, 20); // 20 = 1000 / 50 --> 50fps
	}
	draw();
};