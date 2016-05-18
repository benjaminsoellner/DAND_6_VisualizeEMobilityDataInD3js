define(["AppConstants"], function(AppConstants) {

  AppExplainController = function($scope, $http, $location) {
    this.$http = $http;
    this.$location = $location;
    this.stories = undefined;
    this.selectedStory = undefined;
    this.dataDir = AppConstants.DATA_DIR;
    this.loadSummary(AppConstants.DATA_DIR + "/" + AppConstants.SUMMARY_FILE);
    this.loadStories(AppConstants.DATA_DIR + "/" + AppConstants.SUMMARY_STORIES_FILE);
    this.resetHighlights();
    this.processUrlShowStories();
    $scope.$on("$locationChangeSuccess", this.processUrlHandler());
    $scope.$watch("appExplain.highlights.looseness", this.loosenessChangedHandler());
  };

  AppExplainController.factory = function($scope, $http, $location) {
    return new AppExplainController($scope, $http, $location);
  }

  AppExplainController.prototype.resetHighlights = function() {
    if (!this.highlights) this.highlights = {};
    this.highlights.seriesId = undefined;
    this.highlights.x = undefined;
    this.highlights.xRange = [undefined, undefined];
  };

  AppExplainController.prototype.loadStories = function(storiesUrl) {
    this.$http.get(storiesUrl).success(this.storiesLoadedHandler());
  };

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

  AppExplainController.prototype.loadSummary = function(summaryUrl) {
    this.$http.get(summaryUrl).success(this.summaryLoadedHandler());
  };

  AppExplainController.prototype.summaryLoadedHandler = function() {
    var self = this;
    return function(data) {
      self.summary = data;
      self.resetHighlights();
    };
  };

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

  AppExplainController.prototype.loosenessChangedHandler = function() {
    var self = this;
    return function() {
      self.$location.search("showStories", self.highlights.looseness >= 2 ? 0 : 1);
    };
  };

  AppExplainController.prototype.processUrlHandler = function() {
    var self = this;
    return function($event, $args) {
      self.processUrlShowStories();
    };
  };

  return AppExplainController;

});
