
////////////////////////////////////////////////
// angular module setup
////////////////////////////////////////////////

var untilamApp = angular.module('untilamApp', ['timeDisplayFilters', 'searchFilters', 'deckFilters', 'gDriveLabelFilters', 'songRowClassFilters']);


////////////////////////////////////////////////
// drag and drop
////////////////////////////////////////////////

untilamApp.directive('draggable', function() {
  return {
    // A = attribute, E = Element, C = Class and M = HTML Comment
    restrict:'A',
    //The link function is responsible for registering DOM listeners as well as updating the DOM.
    link: function(scope, element, attrs) {
      element.draggable({
	      cursor: 'none',
	      cursorAt: { top: 25, left: 25 },
				revert: 'invalid',
				revertDuration: 200,
	      helper: function( event ) {
	        return $( "<div class='dragProxy'></div>" );
	      },
				start: function(event, ui) { },
				stop: function(event, ui) { }
      });
    }
  };
});

untilamApp.directive('droppable', function($compile) {
  return {
    restrict: 'A',
    link: function(scope,element,attrs){
      //This makes an element Droppable
      element.droppable({
				hoverClass: 'vinylHover',
				drop:function(event,ui) {
					var dragIndex = angular.element(ui.draggable).data('index');
					var dropEl = angular.element(this);

					var song = scope.songsModel.currentPlayList.songs[dragIndex];
					var deck = dropEl.attr('id') == 'vinylView0' ? scope.mainModel.deck0 : scope.mainModel.deck1;
					deck.loadSong(song);
        }
      });
    }
  };
});


////////////////////////////////////////////////
// local file opening
////////////////////////////////////////////////

untilamApp.directive('file', function(){
	return {
		link: function(scope, el, attrs) {
			el.bind('change', function(event){
				var files = event.target.files;
					scope.$apply();
					scope.openLocalFiles(files);
				});
			}
		};
});


////////////////////////////////////////////////
// main controller
////////////////////////////////////////////////

function MainController($scope, $http) {
		
	// local file opening
	$scope.param = {};

	$scope.songsModel 	= new SongsModel($scope);
	$scope.gDriveModel 	= new GoogleDriveModel($scope, $http);
	$scope.songParser 	= new SongParser($scope, $http);

	$scope.mixerController = new MixerController($scope);

	$scope.keyboardController = new KeyboardController($scope);

	var ae = new AudioEngine();
	var deck0 = new DeckModel($scope, $http, 0, ae);
	var deck1 = new DeckModel($scope, $http, 1, ae);	
	$scope.mainModel = {
		deck0: 						deck0,
		deck1: 						deck1,
		autoPlayerModel: 	new AutoPlayerModel($scope, deck0, deck1),
		audioEngine: 			ae,
		storageModel: 		new StorageModel() 
	};

	$scope.playHeadSlider0 = 0;
	$scope.playHeadSlider1 = 0;

	$scope.turntableController0 = new TurntableController($scope, $scope.mainModel.deck0, $scope.mainModel.audioEngine);
	$scope.turntableController1 = new TurntableController($scope, $scope.mainModel.deck1, $scope.mainModel.audioEngine);
	

	$scope.togglePlay = function(deckInd) {	
		var deck = deckInd == 0 ? $scope.mainModel.deck0 : $scope.mainModel.deck1;
		
		if (deck.isReadyToPlay) {
			deck.isPlaying = !deck.isPlaying;
			$scope['turntableController' + deckInd].onPlayChange(deck.isPlaying);			
		}		
	};

	$scope.toggleAutoPlay = function(turnOn) {	
		var deck = $scope.mainModel.deck0;		
		if (deck.isReadyToPlay) {
			deck.isPlaying = turnOn;
			$scope.turntableController0.onPlayChange(deck.isPlaying);
		}		

		deck = $scope.mainModel.deck1;
		if (deck.isReadyToPlay) {
			deck.isPlaying = turnOn;
			$scope.turntableController1.onPlayChange(deck.isPlaying);
		}		
	};

	$scope.showKbCheatSheet = function() {
		$('.keyboardCheatSheet').css('visibility', 'visible');
	};	

	$scope.hideKbCheatSheet = function() {
		$('.keyboardCheatSheet').css('visibility', 'hidden');
	};	


	ae.begin();	

	// TODO: fix this scope mess here
	$scope.mainModel.audioEngine.sampler0.turntableController = $scope.turntableController0;
	$scope.mainModel.audioEngine.sampler0.deckModel = $scope.mainModel.deck0;
	$scope.mainModel.deck0.turntableController = $scope.turntableController0;

	$scope.mainModel.audioEngine.sampler1.turntableController = $scope.turntableController1;
	$scope.mainModel.audioEngine.sampler1.deckModel = $scope.mainModel.deck1;
	$scope.mainModel.deck1.turntableController = $scope.turntableController1;

	$scope.gDriveModel.refreshSongs(false);
	
	$scope.keyboardController.enableKeyboard();

	$().ready(function(){
	   $('.splitPanel').splitter({/*outline: true, */resizeToWidth: true, minLeft:960, minRight:312, maxRight:700});
	   // $('.splitPanel').splitter({/*outline: true, */resizeToWidth: true, minLeft:960, minRight:280, maxRight:700});
	 });
};