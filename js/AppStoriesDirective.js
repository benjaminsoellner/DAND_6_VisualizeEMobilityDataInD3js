/**
 * Defines the app-stories directive that is used to display a "story-box" - a
 * number of narratives the user can step through in a window on the website
 * which highlight different parts of the graph at different points in the
 * narrative.
 * @module AppStoriesDirectives
 * @exports AppStoriesDirectives
 */
define(["bootstrap"], function() {

  /**
   * The controller governing the directive's state and it's interaction with
   * the outside world.
   * @constructor
   * @param $scope a reference to the angularjs scope of the component
   * @param $element a reference to the element the component is assigned to
   */
  AppStoriesController = function($scope, $element) {
    this.$scope = $scope;
    this.$element = $element;
    if (this.autohide === undefined) this.autohide = true;
    if (this.explore === undefined) this.explore = false;
    $scope.$watch("appStories.highlights.looseness", this.tellStoryHandler());
    $scope.$watch("appStories.story", this.tellStoryHandler());
  };

  /**
   * Factory to create the controller; used as the .controller member of the
   * directive
   * @static
   * @param $scope a reference to the angularjs scope of the component
   * @param $element a reference to the element the component is assigned to
   */
  AppStoriesController.factory = function($scope, $element) {
    return new AppStoriesController($scope, $element)
  };

  /**
   * Function to set the controller attributes to jump to a specific stories
   * @param storyId the story to jump to
   */
  AppStoriesController.prototype.goToStory = function(storyId) {
    for (i in this.stories)
      if (this.stories[i].id == storyId) {
        this.story = this.stories[i];
        this.highlights.looseness = 0;
      }
  };

  /**
   * Function to "tell the current story" - is invoked every time the current
   * story changed and plugs all values from the story object and transforms
   * them to the highlight object so that the areas of a graph are highlighted.
   * Only tells the story if highlights.looseness < 2.
   */
  AppStoriesController.prototype.tellStoryHandler = function() {
    var self = this;
    return function() {
      if (self.highlights.looseness < 2 && self.story) {
        self.highlights.seriesesValues = [];
        // first bring up any metrics that are needed
        if (self.story.metrics && self.metricsselector)
          self.metricsselector({metrics: self.story.metrics});
        // the following can really happen in any arbitrary order
        // zoom in to a specific x range
        if (self.story.xRange)
          self.highlights.xRange = self.story.xRange;
        // highlight a certain series
        if (self.story.series)
          self.highlights.seriesId = self.story.series;
        // highlight a certain metric
        if (self.story.metric)
          self.highlights.metricId = self.story.metric;
        // highlight a certain x/y coordinate or a point close to it
        if (self.story.x)
          self.highlights.x = self.story.x;
        if (self.story.y)
          self.highlights.y = self.story.y;
        // put certain hotspots onto the graph
        if (self.story.hotspots)
          self.highlights.hotspots = self.story.hotspots;
        else
          self.highlights.hotspots = [];
      } else if (self.highlights.looseness > 2 && self.story) {
        // remove hotspots if no story is told at the moment
        self.highlights.hotspots = false;
      }
    }
  };

  /**
   * The &lt;app-stories&gt;...&lt;app-stories&gt; directive. Supports the
   * following attributes: <ul>
   *   <li>stories '=' - an array of stories objects, e.g. from a stories
   *      json file - see tellStoryHandler(...) for a list of properties
   *      a story supports </li>
   *   <li>story '=' - the currently selected story</li>
   *   <li>highlights '=' - the highlights object containing the state of
   *      interaction context the user uses the visualization environment
   *      in right now</li>
   *   <li>homeurl '@' - supply an URL here if you want the user to have the
   *      option to return to an overview page from the stories</li>
   *   <li>metricsselector '&' - a callback to invoke with a value of
   *      metric ids when a story demands a specific sets of metrics to be
   *      shown.</li>
   *   <li>explore '@' - supply an URL here if you want the user to have the
   *      option to go to a more exploratory visualization from the story
   *      box</li>
   * </ul>
   * @constructor
   */
  AppStoriesDirective = function() {
    this.require = [];
    this.restrict = "E";
    this.templateUrl = "templates/AppStories.html";
    this.scope = true;
    this.bindToController = {
      stories: "=",
      story: "=",
      highlights: "=",
      homeurl: "@",
      metricsselector: "&",
      explore: "@"
    };
    this.controllerAs = "appStories";
    this.controller = ["$scope", "$element", AppStoriesController.factory];
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   */
  AppStoriesDirective.factory = function() {
    return new AppStoriesDirective();
  };

  return AppStoriesDirective;

});
