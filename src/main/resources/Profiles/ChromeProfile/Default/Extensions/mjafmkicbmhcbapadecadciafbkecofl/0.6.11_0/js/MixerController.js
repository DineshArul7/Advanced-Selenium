function MixerController($scope) {
	
	var ctxt = this;

	this.crossFader = 0.5;
	this.gain0 	= 0.2;
	this.gain1 	= 0.2;
	
	var CROSS_FADER_MIN = 0.0;
	var CROSS_FADER_MAX = 1.0;

	var crossFadeInterval = null;
	
	////////////////////////////////////
	// channel gains and crossfader
	////////////////////////////////////

	$scope.onGainChange = function(deckInd) {
		ctxt.stopCrossFader();
		ctxt.updateGain();
	};

	$scope.onCrossFaderChange = function() {
		ctxt.stopCrossFader();
		ctxt.updateGain();
	};

	this.updateGain = function()
	{		
		// dbg('updateGain(): gain0 = ' + this.gain0 + ', gain1 = ' + this.gain1 + ', cf = ' + this.crossFader);
		var vol0 = 1.0 - this.gain0;
		var vol1 = 1.0 - this.gain1;
		var cf   = this.crossFader;

		$scope.mainModel.audioEngine.setGain(vol0 * (1 - cf), 0);
		$scope.mainModel.audioEngine.setGain(vol1 * cf, 1);
	};

	////////////////////////////////////
	// keyboard shortcuts
	////////////////////////////////////
	
	this.stopCrossFader = function()
	{
		// dbg('stopCrossFader()');
		if (crossFadeInterval)
			clearInterval(crossFadeInterval);
	};
	
	this.scrubCrossFader = function(toLeft)
	{
		// dbg('MixerController.scrubCrossFader(' + toLeft + ')');

		this.stopCrossFader();
		// crossFadeTween.paused = true;
		// 
		var cf = Number(this.crossFader);
		var delta = 0.03;
		if (toLeft) {
			delta = -delta;
		}
		if (cf + delta > CROSS_FADER_MAX ||
			cf + delta < CROSS_FADER_MIN) {
			delta = 0;
		}
		
		updateCrossFader(cf + delta);
		
		// this.crossFader += delta;
		// this.updateGain();
	};

	/**
	 * @param toLeft - Move towards left or right deck 
	 * @param speed - How fast should the movement happen, use one of the constants CROSS_FADE_SLOW, 
	 * 				  CROSS_FADE_FAST or CROSS_FADE_IMMEDIATE
	 * */
	this.moveCrossFaderToLimit = function(toLeft, speed)
	{
		// dbg('MixerController.moveCrossFaderToLimit(' + toLeft + ', ' + speed + ')');
		
		var target = toLeft ? CROSS_FADER_MIN : CROSS_FADER_MAX;
		var delta;
		if (speed == MixerController.CROSS_FADE_SLOW) 
			delta = 0.01;
		else if (speed == MixerController.CROSS_FADE_FAST) 
			delta = 0.02;
		else
			delta = CROSS_FADER_MAX;

		if (toLeft)
			delta = -delta;
		
		var cf = Number(this.crossFader);
		
		this.stopCrossFader();
		crossFadeInterval = setInterval (function() {
			if ((delta > 0 && cf >= target) || (delta < 0 && cf <= target)) {
				clearInterval(crossFadeInterval);
				cf = target;
			}
			else {
				cf += delta;
			}
			updateCrossFader(cf);
		}, 40); // 40 = 1000 / 25 = 25 fps
	};
	
	var updateCrossFader = function (newValue) {
		
		var val = newValue;
		if (val < CROSS_FADER_MIN)
			val = CROSS_FADER_MIN; 
		else if (val > CROSS_FADER_MAX)
			val = CROSS_FADER_MAX;

		// dbg('MixerController.updateCrossFader(' + newValue + ') --> ' + val);

		ctxt.crossFader = newValue;
		ctxt.updateGain();

		// trigger bindings to refresh view
		if(!$scope.$$phase) {
			$scope.$apply();
		}		
	};
}

MixerController.CROSS_FADE_SLOW				= 0;
MixerController.CROSS_FADE_FAST				= 1;
MixerController.CROSS_FADE_IMMEDIATE	= 2;
