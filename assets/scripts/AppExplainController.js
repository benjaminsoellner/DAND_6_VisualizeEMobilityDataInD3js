/**
 * Exposes an AngularJS controller to retrieve the data for the explanatory
 * visualization and manage the interactive state of the visualization.
 * @module AppExplainController
 * @exports AppExplainController
 */
define(["AppConstants"], function(AppConstants) {

  /**
   * The controller retrieving the data for the explanatory visualization and
   * governing the interaction on this visualization.
   * @constructor
   */
  AppExplainController = function($scope, $http, $location) {
    // memorize $http and $location service
    this.$http = $http;
    this.$location = $location;
    // currently we do not have any stories loaded or selected
    this.stories = undefined;
    this.selectedStory = undefined;
    // load all the stuff
    this.dataDir = AppConstants.DATA_DIR;
    this.loadSummary(this.dataDir + "/" + AppConstants.SUMMARY_FILE);
    this.loadStories(this.dataDir + "/" + AppConstants.SUMMARY_STORIES_FILE);
    // reset all the highlights
    this.resetHighlights();
    // if we have a "showStories" parameter set in the URL, process it
    this.processUrlShowStories();
    // show or hide storybox everytime the URL changes or the internal state for
    // showing the story box changes
    $scope.$on("$locationChangeSuccess",
        this.processUrlHandler());
    $scope.$watch("appExplain.highlights.looseness",
        this.loosenessChangedHandler());
  };

  /**
   * Factory to create the directive; used in the angular.directive call.
   * @static
   */
  AppExplainController.factory = function($scope, $http, $location) {
    return new AppExplainController($scope, $http, $location);
  };

  /**
   * Resets all "highlights" back to normal, that means, no part of the
   * visualization will be highlighted/marked/zoomed-in etc. after calling this
   * method.
   */
  AppExplainController.prototype.resetHighlights = function() {
    if (!this.highlights) this.highlights = {};
    this.highlights.seriesId = undefined;
    this.highlights.x = undefined;
    this.highlights.xRange = [undefined, undefined];
  };

  /**
   * Loads the stories for the story box from an URL which is supplied to the
   * function.
   * @param storiesUrl the URL to load the stories data from
   */
  AppExplainController.prototype.loadStories = function(storiesUrl) {
    this.$http.get(storiesUrl).success(this.storiesLoadedHandler());
  };

  /**
   * Returns a callback to be invoked with the JSON data as parameter after the
   * stories JSON file is loaded
   */
  AppExplainController.prototype.storiesLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.stories = data;
      if (data.length > 0) {
        self.selectedStory = data[0];
        self.highlights.looseness = 0;
      }
      self.processUrlShowStories();
    };
  };

  /**
   * Loads the summary data for the visualization from an URL which is supplied
   * to the function.
   * @param summaryUrl the url of the summary (explorative) data
   */
  AppExplainController.prototype.loadSummary = function(summaryUrl) {
    this.$http.get(summaryUrl).success(this.summaryLoadedHandler());
  };

  /**
   * Returns a callback to be invoked with the JSON data as parameter after the
   * visualization JSON file is loaded.
   */
  AppExplainController.prototype.summaryLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.summary = data;
      self.resetHighlights();
    };
  };

  /**
   * Uses AngularJS's $location provider to resolve, if a "showStories"
   * parameter was given when loading the page and configures the "highlights"
   * object of the page in such a way, that the storybox can be eigher shown
   * or hidden.
   */
  AppExplainController.prototype.processUrlShowStories = function() {
    this.showStories = (this.$location.search().showStories != 0);
    if (this.showStories) {
      this.highlights.looseness = 0;
    } else if (this.highlights.looseness < 2) {
      this.highlights.looseness = 2;
    } else if (this.highlights.looseness === undefined) {
      this.highlights.looseness = 2;
    }
  };

  /**
   * Returns a callback that should be invoked every time the
   * highlights.looseness property changes. This property signifies if the
   * storybox should be hidden or shown. Based on this, the callback updates
   * the URL to contain a specific "showStories" parameter.
   */
  AppExplainController.prototype.loosenessChangedHandler = function() {
    var self = this;
    return function() {
      self.$location.search("showStories", self.highlights.looseness >= 2 ? 0 : 1);
    };
  };

  /**
   * Returns a callback that should be invoked any time the URL search string
   * is changed.
   * @see module:AppExplainController~AppExplainController#processUrlShowStories
   */
  AppExplainController.prototype.processUrlHandler = function() {
    var self = this;
    return function($event, $args) {
      self.processUrlShowStories();
    };
  };

  return AppExplainController;

});
