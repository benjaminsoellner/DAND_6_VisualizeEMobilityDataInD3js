define(["bootstrap"], function() {

  AppStoriesController = function($scope, $element) {
    this.$scope = $scope;
    this.$element = $element;
    if (this.autohide === undefined) this.autohide = true;
    if (this.explore === undefined) this.explore = false;
    $scope.$watch("appStories.highlights.looseness", this.tellStoryHandler());
    $scope.$watch("appStories.story", this.tellStoryHandler());
  };

  AppStoriesController.factory = function($scope, $element) {
    return new AppStoriesController($scope, $element)
  };

  AppStoriesController.prototype.goToStory = function(storyId) {
    for (i in this.stories)
      if (this.stories[i].id == storyId) {
        this.story = this.stories[i];
        this.highlights.looseness = 0;
      }
  };

  AppStoriesController.prototype.tellStoryHandler = function() {
    var self = this;
    return function() {
      if (self.highlights.looseness < 2 && self.story) {
        self.highlights.seriesesValues = [];
        if (self.story.metrics && self.metricsselector)
          self.metricsselector({metrics: self.story.metrics});
        if (self.story.xRange)
          self.highlights.xRange = self.story.xRange;
        if (self.story.series)
          self.highlights.seriesId = self.story.series;
        if (self.story.metric)
          self.highlights.metricId = self.story.metric;
        if (self.story.x)
          self.highlights.x = self.story.x;
        if (self.story.y)
          self.highlights.y = self.story.y;
        if (self.story.hotspots)
          self.highlights.hotspots = self.story.hotspots;
        else
          self.highlights.hotspots = [];
      } else if (self.highlights.looseness > 2 && self.story) {
        self.highlights.hotspots = false;
      }
    }
  };

  AppStoriesDirective = function() {
    this.require = [];
    this.restrict = "E";
    this.templateUrl = "assets/templates/AppStories.html";
    this.scope = true;
    this.bindToController = {
      stories: "=",
      story: "=",
      highlights: "=",
      homeurl: "@",
      autohide: "@",
      metricsselector: "&",
      explore: "@"
    };
    this.controllerAs = "appStories";
    this.controller = AppStoriesController.factory;
  };

  AppStoriesDirective.factory = function() {
    return new AppStoriesDirective();
  };

  return AppStoriesDirective;

});
