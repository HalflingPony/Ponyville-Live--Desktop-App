/** ngInject **/
function MediaPlayerCtrl($scope, $element, $timeout, EventBus, PvlService, ColorThief) {
  
  /**
   * To make sure we have access to the viewmodel in all closures
   * we declare it as a local, immutable variable.
   */
  let vm = this;
  
  /**
   * These variables are all immutable values used throughout
   * the code.
   */
  let defaultArtwork = '/images/mascot.png';
  let colorThief = new ColorThief();
  var playingCache = {};


  /**
   * These are jQuery elements we want to use
   */
  let mediaElement = angular.element('audio', $element);
  let artworkImg = angular.element('.artwork img', $element);
  let flipEl = angular.element('.flipper');

  // The data for the currently playing track
  vm.nowPlaying = null;
  // URL to the current song's cover art
  vm.artworkUrl = defaultArtwork;
  // Whether the audio elements loading indicator should show
  vm.isLoading = true;
  // Whether the audio element is in playback
  vm.isPlaying = false;
  // viewmodel binding for our toggle function
  vm.togglePlayback = togglePlayback;
  // The currently selected station
  vm.station = null;
  // The raw audio DOM element
  vm.mediaElement = mediaElement[0];

  /**
   * Given the current state of the audio element,
   * toggle it.
   */
  function togglePlayback() {
    if(vm.mediaElement.paused) {
      vm.mediaElement.play();
    } else {
      vm.mediaElement.pause();
    }
  }

  /**
   * Binding DOM events to toggle our application state
   */
  mediaElement.on({
    loadstart:  () => $scope.$apply(() => vm.isLoading = true),
    canplay:    () => $scope.$apply(() => vm.isLoading = false),
    play:       () => $scope.$apply(() => vm.isPlaying = true),
    pause:      () => $scope.$apply(() => vm.isPlaying = false)
  });

  /**
   * Listen to the event bus and update the station to
   * be the one the user selected elsewhere in the application.
   * Also updates the nowPlaying to match the current station
   * if the cache exists.
   */
  let stationListener = (evt, station) => { 
    vm.station = station;

    if(playingCache[station.shortcode]) {
      vm.nowPlaying = playingCache[station.shortcode];
    }

    if(flipEl.hasClass('flipped')) {
      flipEl.toggleClass('double-flipped');
    }
  };

  /**
   * Listen to the event bus and update the nowPlaying
   * metadata and cache.
   */
  let nowPlayingListener = (evt, data) => {
    playingCache = data;

    if(!vm.station) return;

    var datum = data[vm.station.shortcode],
        externalData = datum.current_song.external,
        url = defaultArtwork;
    
    /**
     * PVL offers external data that might provide
     * cover artwork for the track. If that exists,
     * parse it and load it into the model object
     * such that the view can load it.
     */
    if(externalData.hasOwnProperty('bronytunes')) {
      if(externalData.bronytunes.hasOwnProperty('image_url')) {
        url = externalData.bronytunes.image_url;
      }
    }

    vm.nowPlaying = data[vm.station.shortcode];
    vm.artworkUrl = url;
  };

  // Listen to station selections on the event bus
  var unsubStationSelect  = EventBus.on('pvl:stationSelect', stationListener);
  // Listen for nowPlaying data
  var unsubNowPlaying     = EventBus.on('pvl:nowPlaying', nowPlayingListener);
  
  // If our scope is ever destoryed, stop listening to the event bus
  $scope.$on('$destroy', () => {
    unsubStationSelect();
    unsubNowPlaying();
  });
}

function MediaPlayerDirective() {
  return {
    restrict: 'E',
    templateUrl: '/mediaPlayer.html',
    scope: true,
    controller: MediaPlayerCtrl,
    controllerAs: 'mediaPlayer',
    bindToController: true
  };
}

angular
  .module('PVL')
  .directive('pvlMediaPlayer', MediaPlayerDirective);