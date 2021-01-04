function FxPadController($scope, deckInd, audioEngine) {
	
	var ctxt = this;

	this.deckInd 			= deckInd;
	this.audioEngine 	= audioEngine;

	var sampler = audioEngine['sampler' + deckInd];

	// bound at view level
	this.effectNameLabel 	= '';
	this.paramXLabel 			= '';
	this.paramYLabel 			= '';
	
	var currentEffectInd = 0;
	var effectLabels	= [ ["Echo", 				"delay",		"reverb"], 
												["Chorus", 			"speed", 		"depth"], 
												["Filter",			"cutoff", 	"resonance"], 
												["Lofi",				"bitrate", 	""], 
												["Distortion", 	"drive", 		"modulate"]];

	var parameterValues = [];

	var dragArea;					// the element (div) in which the dragging happens; DOM element
	var dragCursor;				// the crosshair cursor; DOM element
	var dragAreaPosition;	// top left position of the dragArea; Array with two values (x and y)

	// defined in the css (but slightly smaller because of cursor clipping)
	var areaWidth = 349;
	var areaHeight = 151;
	var cursorWidth = 24;


	////////////////////////////////////
	// changing effects
	////////////////////////////////////

	this.nextEffect = function () {
		currentEffectInd++;
		if (currentEffectInd >= effectLabels.length)
			currentEffectInd = 0;
			
		updateLabels();
		updateCursorPosition();
	};

	this.resetEffects = function () {
		var oldCurrentEffectInd = currentEffectInd;
		for (var i=0; i<parameterValues.length; i++) {
			parameterValues[i][0] = 0;
			parameterValues[i][1] = 0;
			currentEffectInd = i;
			updateAudio();
		}
		currentEffectInd = oldCurrentEffectInd;

		updateCursorPosition();
	};


	var updateLabels = function () {
		ctxt.effectNameLabel 	= effectLabels[currentEffectInd][0].toUpperCase();
		ctxt.paramXLabel 			= getEffectParameterName(currentEffectInd, 0);
		ctxt.paramYLabel 			= getEffectParameterName(currentEffectInd, 1);

		// Adjust vertical label's position. The timeout is needed because the offsetHeight is updated only after rerender.
		// Bit dirty, should happen by css really. 
		setTimeout(function () {
			var verticalLabel = document.getElementById('fxPadVerticalLabel' + ctxt.deckInd);
			verticalLabel.style.top = ((dragArea.offsetHeight - verticalLabel.offsetHeight) * 0.5) + 'px';
		}, 5);
		
	};

	/**
	 * Returns a String of effect parameter name. Because the y-axis parameter is displayed as 
	 * a vertical text with one letter on each row, extra line breaks are added into the string 
	 * while forming this representation.
	 * */
	var getEffectParameterName = function (effectIndex, parameterIndex) {
		var rv = effectLabels[effectIndex][parameterIndex+1].toString().toUpperCase();
		if (parameterIndex == 0)
			return rv;
		else
		{
			for (var i=rv.length; i>0; i--)
			{
				rv = rv.substr(0, i) + ' ' + rv.substr(i);
			}
			return rv;
		}
	};


	////////////////////////////////////
	// dragging the cursor
	////////////////////////////////////

	this.onMouseDown = function (event)
	{
		// dbg('onMouseDown');
		
		// preventDefault must be called to avoid a text edit cursor from appearing
		event.preventDefault();
		window.document.body.style.cursor = 'none';

		updateEffect(event.clientX, event.clientY);

		// start listening for mouse events
		document.addEventListener('mousemove', 	onMouseMove, 	true);
		document.addEventListener('drag', 			onMouseMove, 	true);
		document.addEventListener('mouseup', 		onMouseUp, 		true);
	};

	var onMouseMove = function(evt) {
		updateEffect(evt.clientX, evt.clientY);
	};

	var onMouseUp = function() {
		window.document.body.style.cursor = 'auto';

		// stop listening for mouse events
		document.removeEventListener('mousemove', 	onMouseMove, 	true);
		document.removeEventListener('drag', 				onMouseMove, 	true);
		document.removeEventListener('mouseup', 		onMouseUp, 		true);
	};

	/*
	* Triggered by Hammer.
	*/
	this.onTouch = function (event) {
		// preventDefault must be called to avoid a text edit cursor from appearing
		event.preventDefault();
		window.document.body.style.cursor = 'none';

		// dbg('onTouch(): type = ' + event.type);
		// dbg('onTouch(): center xy = ' + event.gesture['center'].pageX + ', ' + event.gesture['center'].pageY);		
		updateEffect(event.gesture['center'].pageX, event.gesture['center'].pageY);
	};

	this.onTouchEnd = function (event) {
		window.document.body.style.cursor = 'auto';
	};


	var updateEffect = function(x, y) {

		x -= dragAreaPosition[0] + 3;
		y -= dragAreaPosition[1] + 2;

		// make sure the cursor stays in the draggable area
		if (x < 0)
			x = 0;
		else if (x > areaWidth)
			x = areaWidth;

		if (y < 0)
			y = 0;
		else if (y > areaHeight)
			y = areaHeight;

		// get the effect levels
		var parameterizedX = Math.round(x / areaWidth * 100);
		var parameterizedY = Math.round((areaHeight - y) / areaHeight * 100);

		parameterValues[currentEffectInd][0] = parameterizedX;
		parameterValues[currentEffectInd][1] = parameterizedY;

		updateCursorPosition();
		updateAudio();
	};

	/* Update the cursor on the view level.
	*/
	var updateCursorPosition = function ()
	{
		dragCursor.style.left = (parameterValues[currentEffectInd][0] * areaWidth / 100 + 2 - 0.5 * cursorWidth) + 'px';
		dragCursor.style.top = (areaHeight - (parameterValues[currentEffectInd][1] / 100) * areaHeight + 1 - 0.5 * cursorWidth) + 'px';
		// dbg('updateCursorPosition(): --> param xy = ' + parameterValues[currentEffectInd][0] + ', ' + parameterValues[currentEffectInd][1]);
		// dbg('updateCursorPosition(): --> cursor xy = ' + dragCursor.style.left + ', ' + dragCursor.style.top);		
	};
	
	/*
	* Invoked upon window resize.
	*/
	var refreshPosition = function () {
		dragAreaPosition = findElementPosition(dragArea);
	};

	////////////////////////////////////
	// updating audio engine
	////////////////////////////////////

	var updateAudio = function () {
		// dbg('updateAudio(): current effect = ' + currentEffectInd + ', x = ' + parameterValues[currentEffectInd][0] + ', y = ' + parameterValues[currentEffectInd][1]);
		
		// TODO: change audio engine fx parameters based on currently active effect
				
		var param0 = parameterValues[currentEffectInd][0];
		var param1 = parameterValues[currentEffectInd][1];
				
		switch (currentEffectInd)
		{
			case 0: // echo
				// audioController.setChannelDelay(playbackIndex, param0);
				// audioController.setChannelReverb(playbackIndex, param1);
				sampler.setChannelDelay(param0);
				sampler.setChannelReverb(param1);
				break;

			case 1: // chorus
				sampler.setChorusSpeed(param0 * 0.00001);
				sampler.setChorusSize(param1 * 2);
				break;

			case 2: // filter
				sampler.setResonance(param1);
				sampler.setBaseCutoff((100 - param0) * 0.01);
				break;

			case 3: // lofi
				sampler.setBitrate(param0);
				break;

			case 4: // distortion
				sampler.setOverdrive(param0 * 0.25);
				sampler.setOverdriveModulation(param1 * 0.01);
				break;

			default:
				dbg("updateAudio(): illegal effect index " + currentEffectInd);
		}			


		
	};

	////////////////////////////////////
	// initialize
	////////////////////////////////////

	var begin = function() 
	{
		for (var i=0; i<effectLabels.length; i++) {
			parameterValues.push([0, 0]);
		}

		updateLabels();
		updateAudio();

		window.addEventListener('DOMContentLoaded', function(e) {
			dragArea 		= window.document.getElementById('fxPadCursorArea' + ctxt.deckInd);
			dragCursor 	= window.document.getElementById('fxPadCursor' + ctxt.deckInd);

			refreshPosition();
			updateCursorPosition();
			
			$(window).resize(function() {
				refreshPosition();
			});
		});
	};
	
	begin();
};