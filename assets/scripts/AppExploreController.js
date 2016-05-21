/**
 * Exposes an AngularJS controller to retrieve the data for the exploratory
 * visualization and manage the interactive state of the visualization.
 * @module AppExplainController
 * @exports AppExplainController
 */
define(["AppConstants"], function(AppConstants) {

  /**
   * The controller retrieving the data for the exploratory visualization and
   * governing the interaction on this visualization.
   * @constructor
   */
  AppExploreController = function($scope, $http, $location) {
    // memorize $http and $location service
    this.$http = $http;
    this.$location = $location;
    // currently, we have no scenarios loaded and not scenarios selected
    this.scenarios = [];
    this.selectedScenario = undefined;
    this.dataDir = AppConstants.DATA_DIR;
    this.scenariosFile = AppConstants.SCENARIOS_FILE;
    // react everytime the selected scenarios, metrics or stories changed
    $scope.$watch("appExplore.selectedScenario",
        this.selectedScenarioChangedHandler());
    $scope.$watch("appExplore.selectedMetrics",
        this.selectedMetricsChangedHandler(), true); // needs deep comparison
    $scope.$watch("appExplore.selectedStory",
        this.selectedStoryChangedHandler());
    // react every time the URL search string changed
    $scope.$on("$locationChangeSuccess", this.processUrlHandler());
    // reset highlights: currently nothing is highlighted
    this.resetHighlights();
    // load scenarios
    this.loadScenarios(this.dataDir + "/" + this.scenariosFile);
  };

  /**
   * Factory to create the directive; used in the angular.directive call.
   * @static
   */
  AppExploreController.factory = function($scope, $http, $location) {
    return new AppExploreController($scope, $http, $location);
  };

  /**
   * Loads the scenario file containing all the selectable scenarios from a URL
   * supplied to the function.
   * @param scenarioUrl the URL to load the scenarios file from
   */
  AppExploreController.prototype.loadScenarios = function(scenarioUrl) {
    this.$http.get(scenarioUrl).success(this.scenariosLoadedHandler());
  };

  /**
   * Loads a metrics file containing the metrics data from a URL
   * supplied to the function.
   * @param metricsUrl the URL to load the metrics file from
   */
  AppExploreController.prototype.loadMetrics = function(metricsUrl) {
    this.resetHighlights();
    this.$http.get(metricsUrl).success(this.metricsLoadedHandler());
  };

  /**
   * Loads a stories file containing the stories from a URL
   * supplied to the function.
   * @param storiesUrl the URL to load the stories file from
   */
  AppExploreController.prototype.loadStories = function(storiesUrl) {
    this.$http.get(storiesUrl).success(this.storiesLoadedHandler());
  };

  /**
   * Resets all "highlights" back to normal, that means, no part of the
   * visualization will be highlighted/marked/zoomed-in etc. after calling this
   * method.
   */
  AppExploreController.prototype.resetHighlights = function() {
    if (!this.highlights) this.highlights = {};
    this.highlights.seriesId = undefined;
    this.highlights.metric = undefined;
    this.highlights.x = undefined;
    this.highlights.xRange = [undefined, undefined];
    this.highlights.looseness = 0;
    this.highlights.seriesesValues = {};
  };

  /**
   * Helper function to select a number of metrics from the loaded metrics
   * by its 'id' property. Can be used, e.g., if a storybox needs to display
   * certain metric graphs based on the story's 'metrics' property.
   * @param metricsIds an array of metric ids
   */
  AppExploreController.prototype.selectMetricsById = function(metricsIds) {
    this.selectedMetrics = [];
    for (i in this.metrics) {
      if (metricsIds.indexOf(this.metrics[i].id) != -1)
        this.selectedMetrics.push(this.metrics[i])
    }
  };

  /**
   * Returns a callback to be invoked with the JSON data as parameter after a
   * metrics JSON file is loaded.
   */
  AppExploreController.prototype.metricsLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.metrics = data;
    };
  };

  /**
   * Returns a callback to be invoked with the JSON data as parameter after a
   * stories JSON file is loaded.
   */
  AppExploreController.prototype.storiesLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.stories = data;
      if (data.length > 0) {
        self.selectedStory = data[0];
        self.highlights.looseness = 0;
      }
      self.processUrlStoryId();
    };
  };

  /**
   * Returns a callback to be invoked with the JSON data as parameter after the
   * scenarios JSON file is loaded.
   */
  AppExploreController.prototype.scenariosLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.scenarios = data;
      self.processUrlScenarioId();
    };
  };

  /**
   * Returns a callback that should be invoked every time the user changes the
   * selected scenario. The callback updates the URL's search string and loads
   * all metrics and stories associated with the scenario.
   */
  AppExploreController.prototype.selectedScenarioChangedHandler = function() {
    var self = this;
    return function() {
      // reset metrics and stories
      self.metrics = undefined;
      self.stories = undefined;
      self.selectedMetrics = [];
      self.serieses = [];
      // reset highlights
      self.resetHighlights();
      // if we actually do have a scenario selected
      if (self.selectedScenario !== undefined) {
        // ... update the URL's search string
        self.$location.search("scenarioId", self.selectedScenario.id);
        // load metrics
        self.loadMetrics(self.dataDir + "/" + self.selectedScenario.dataFile);
        // load stories, if stories are associated with this scenario
        if (self.selectedScenario.storiesFile)
          self.loadStories(self.dataDir + "/" + self.selectedScenario.storiesFile);
      }
    };
  };

  /**
   * Returns a callback that should be invoked every time the user changes the
   * selected story. The callback updates the URL's search string to contain
   * a reference to that story.
   */
  AppExploreController.prototype.selectedStoryChangedHandler = function() {
    var self = this;
    return function() {
      if (self.selectedStory !== undefined)
        self.$location.search("storyId", self.selectedStory.id);
    }
  };

  /**
   * Returns a callback that should be invoked every time the user changes the
   * selected metrics. The callback updates an internal array "serieses"
   * that contains all the serieses of all the metrics.
   */
  AppExploreController.prototype.selectedMetricsChangedHandler = function() {
    var self = this;
    return function() {
      self.serieses = [];
      for (i in self.selectedMetrics)
        for (j in self.selectedMetrics[i].serieses)
          self.serieses.push(self.selectedMetrics[i].serieses[j])
    }
  };

  /**
   * Returns a callback that should be invoked every time the URL's search
   * string changes. The callback processes the URL-parameters 'scenarioId' and
   * 'storyId'.
   * @see module:AppExploreController~AppExploreController#processUrlScenarioId
   * @see module:AppExploreController~AppExploreController#processUrlStoryId
   */
  AppExploreController.prototype.processUrlHandler = function() {
    var self = this;
    return function($event, $args) {
      self.processUrlScenarioId();
      self.processUrlStoryId();
    }
  };

  /**
   * Updates the selected scenario based on the URL's search parameter
   * 'scenarioId'.
   */
  AppExploreController.prototype.processUrlScenarioId = function() {
    var scenarioId = this.$location.search().scenarioId,
        scenario = undefined;
    for (i in this.scenarios)
      if (this.scenarios[i].id == scenarioId)
        scenario = this.scenarios[i];
    this.selectedScenario = scenario;
  };

  /**
   * Updates the selected story based on the URL's search parameter 'storyId'.
   */
  AppExploreController.prototype.processUrlStoryId = function() {
    var storyId = this.$location.search().storyId,
        story = undefined;
    if (this.stories && this.stories.length > 0) {
      for (i in this.stories)
        if (this.stories[i].id == storyId)
          story = this.stories[i];
      if (story === undefined && this.selectedStory === undefined)
        this.selectedStory = this.stories[0];
    }
  };

  return AppExploreController;

});
