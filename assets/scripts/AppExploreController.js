define(["AppConstants"], function(AppConstants) {

  AppExploreController = function($scope, $http, $location) {
    this.$http = $http;
    this.$location = $location;
    this.scenarios = [];
    this.selectedScenario = undefined;
    this.dataDir = AppConstants.DATA_DIR;
    this.scenariosFile = AppConstants.SCENARIOS_FILE;
    $scope.$watch("appExplore.selectedScenario", this.selectedScenarioChangedHandler());
    $scope.$watch("appExplore.selectedMetrics", this.selectedMetricsChangedHandler(), true);
    $scope.$watch("appExplore.selectedStory", this.selectedStoryChangedHandler());
    $scope.$on("$locationChangeSuccess", this.processUrlHandler());
    this.resetHighlights();
    this.loadScenarios(this.dataDir + "/" + this.scenariosFile);
  };

  AppExploreController.factory = function($scope, $http, $location) {
    return new AppExploreController($scope, $http, $location);
  }

  AppExploreController.prototype.loadScenarios = function(scenarioUrl) {
    this.$http.get(scenarioUrl).success(this.scenariosLoadedHandler());
  };

  AppExploreController.prototype.loadMetrics = function(metricsUrl) {
    this.resetHighlights();
    this.$http.get(metricsUrl).success(this.metricsLoadedHandler());
  };

  AppExploreController.prototype.loadStories = function(storiesUrl) {
    this.$http.get(storiesUrl).success(this.storiesLoadedHandler());
  };

  AppExploreController.prototype.resetHighlights = function() {
    if (!this.highlights) this.highlights = {};
    this.highlights.seriesId = undefined;
    this.highlights.metric = undefined;
    this.highlights.x = undefined;
    this.highlights.xRange = [undefined, undefined];
    this.highlights.looseness = 0;
    this.highlights.seriesesValues = {};
  };

  AppExploreController.prototype.selectMetricsById = function(metricsIds) {
    this.selectedMetrics = []
    for (i in this.metrics) {
      if (metricsIds.indexOf(this.metrics[i].id) != -1)
        this.selectedMetrics.push(this.metrics[i])
    }
  };

  AppExploreController.prototype.metricsLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.metrics = data;
    };
  };

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

  AppExploreController.prototype.scenariosLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.scenarios = data;
      self.processUrlScenarioId();
    };
  };

  AppExploreController.prototype.selectedScenarioChangedHandler = function() {
    var self = this;
    return function() {
      self.metrics = undefined;
      self.stories = undefined;
      self.selectedMetrics = [];
      self.serieses = [];
      self.resetHighlights();
      if (self.selectedScenario !== undefined)
        self.$location.search("scenarioId", self.selectedScenario.id);
      if (self.selectedScenario) {
        self.loadMetrics(self.dataDir + "/" + self.selectedScenario.dataFile);
        if (self.selectedScenario.storiesFile)
          self.loadStories(self.dataDir + "/" + self.selectedScenario.storiesFile);
      }
    };
  };

  AppExploreController.prototype.selectedStoryChangedHandler = function() {
    var self = this;
    return function() {
      if (self.selectedStory !== undefined)
        self.$location.search("storyId", self.selectedStory.id);
    }
  };

  AppExploreController.prototype.selectedMetricsChangedHandler = function() {
    var self = this;
    return function() {
      self.serieses = [];
      for (i in self.selectedMetrics)
        for (j in self.selectedMetrics[i].serieses)
          self.serieses.push(self.selectedMetrics[i].serieses[j])
    }
  };

  AppExploreController.prototype.processUrlHandler = function() {
    var self = this;
    return function($event, $args) {
      self.processUrlScenarioId();
      self.processUrlStoryId();
    }
  };

  AppExploreController.prototype.processUrlScenarioId = function() {
    var scenarioId = this.$location.search().scenarioId,
        scenario = undefined;
    for (i in this.scenarios)
      if (this.scenarios[i].id == scenarioId)
        scenario = this.scenarios[i];
    this.selectedScenario = scenario;
  };

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
