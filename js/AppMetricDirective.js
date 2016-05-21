/**
 * Exposes the AngularJS code of the &lt;app-metric&gt; directive which
 * displays a exploratory graph. Uses a derivative of the AppChartController
 * controller/module to place an AppChart object in the element reserved by the
 * directive.
 * @module AppMetricDirective
 * @exports AppMetricDirective
 */
define(["AppHelper", "AppChartController"], function(AppHelper, AppChartController) {

  /**
   * Sets up a controller to glue together the generic AppChart chart drawing
   * component with the &lt;app-metric&gt; AngularJS directive & scope. Enhances
   * the AppChartController by some functionality like linking together the x-
   * axis of various graphs, populating selected values to other directives
   * listening to seriesesValuesChanged events etc.
   * @constructor
   * @extends module:AppChartController~AppChartController
   * @param $scope the AngularJS scope of the directive where the chart should
   *   be placed.
   * @param $element the DOM element of the directive
   * @param options some options that are specific to the directive
   *   implementation (same as in AppChartController).
   */
  AppMetricController = function($scope, $element, options) {
    // call super
    AppChartController.call(this, $scope, $element, options);
    // add handlers for listening for selection of different metrics, zooming/
    // panning together on the x-axis and change of the "looseness" parameter.
    n = options.ctrlName;
    $scope.$watch(n + ".highlights.metricId",
        this.highlightsUpdatedHandler());
    $scope.$watch(n + ".highlights.metricId",
        this.seriesesValuesUpdatedHandler());
    $scope.$watch(n + ".highlights.x",
        this.seriesesValuesUpdatedHandler());
    $scope.$watch(n + ".highlights.xRange",
        this.xRangeUpdatedHandler());
    $scope.$watch(n + ".highlights.looseness",
        this.loosenessUpdatedHandler());
  };
  AppMetricController.prototype = Object.create(AppChartController.prototype);

  /**
   * Returns the factory function of the controller. The factory is used in
   * the directives .controller property. You have to specify some "options"
   * to the factory. The factory callback returned will accept exactly two
   * parameters: $scope and $element.
   * @static
   * @param options - see AppChartController.getFactory
   */
  AppMetricController.getFactory = function(options) {
    return function($scope, $element) {
      return new AppMetricController($scope, $element, options);
    };
  };

  /**
   * This function must be called when the directive using this controller links
   * the directive to a DOM element. It takes care of actually drawing the
   * chart into the DOM element.
   */
  AppMetricController.prototype.link = function() {
    // call super
    AppChartController.prototype.link.call(this);
    // add handlers for mouse enter / exit to be able to react to mouse
    // hovering over one of the many metric graphs
    this.chart.attachMouseEnterHandler(this.metricHighlightedHandler());
    this.chart.attachMouseLeaveHandler(this.metricUnhighlightedHandler());
  };

  /**
   * Returns a callback that can be invoked if the highlights object supplied
   * to the directive / controller is changed. Will delegate the highlight
   * change to the included AppChart object.
   */
  AppMetricController.prototype.highlightsUpdatedHandler = function() {
    // extends the super handler but adds addtitional functionality of
    // highlighting / unhighlighting a complete metrics chart.
    var superHandler = AppChartController.prototype.highlightsUpdatedHandler.call(this);
    var self = this;
    return function() {
      superHandler();
      if (self.chart) {
        var highlightThisChart = (self.data.id == self.highlights.metricId);
        self.chart.highlight({
          thisChart: highlightThisChart
        });
      }
    }
  };

  /**
   * Returns a callback that can be invoked if a datapoint is selected. Will
   * update the highlights.seriesesValues object accordingly.
   */
  AppMetricController.prototype.seriesesValuesUpdatedHandler = function() {
    var self = this;
    return function() {
      // did we highlight anything at all in any graph?
      anyPointHighlighted = self.highlights.x;
      // have we highlighted this graph or are we in another graph?
      thisMetricHighlighted = (self.highlights.metricId === self.data.id);
      if (!anyPointHighlighted)
        // we did not highlight anything at all - remove all highlighted points
        self.highlights.seriesesValues = {};
      else {
        // find the point corresponding to (highlights.x, highlights.y)
        var serieses = self.data.serieses,
            values = self.chart.getNearest(
                        self.highlights.x, self.highlights.y),
            currentValues = self.highlights.seriesesValues;
            newValues = {};
        // create a "newValues" seriesesValues array with the content of the
        // old elements
        for (seriesId in currentValues)
          newValues[seriesId] = currentValues[seriesId];
        // but overwrite all the values we obtained from this graph
        for (seriesId in values)
          newValues[seriesId] = values[seriesId];
        // save this array of values into the highlights.seriesesValues object
        // this might actually happen multiple times until all metric graphs
        // had the chance to update their data points.
        self.highlights.seriesesValues = newValues;
      }
    };
  };

  /**
   * Returns a callback that should be invoked any time the x/y extent changes
   * because the user zooms or pans in the graph. Updates the highlights object
   * (xRange property) and the "looseness" property accordingly.
   */
  AppMetricController.prototype.zoomedPannedHandler = function() {
    var superHandler =
          AppChartController.prototype.zoomedPannedHandler.call(this);
    var self = this;
    return function(minX, maxX, minY, maxY) {
      superHandler(minX, maxX, minY, maxY);
      self.$scope.$apply(function() {
        if (self.highlights.looseness < 3)
          self.highlights.looseness = 3;
      });
    };
  };

  /**
   * Returns a callback that should be invoked any time a metric graph as a
   * whole is highlighted (mouseover'ed). Updates the highlights.metricId object
   * accordingly.
   */
  AppMetricController.prototype.metricHighlightedHandler = function() {
    var self = this;
    return function() {
      self.$scope.$apply(function() {
        self.highlights.metricId = self.data.id;
        if (self.highlights.looseness < 1)
          self.highlights.looseness = 1;
      });
    };
  };

  /**
   * Returns a callback that should be invoked any time a metric graph as a
   * whole is unhighlighted (mouseout'ed). Updates the highlights.metricId
   * object accordingly.
   */
  AppMetricController.prototype.metricUnhighlightedHandler = function() {
    var self = this;
    return function() {
      self.$scope.$apply(function() {
        self.highlights.metricId = undefined;
        if (self.highlights.looseness < 1)
          self.highlights.looseness = 1;
      });
    };
  };

  /**
   * The &lt;app-metric&gt; directive. Supports the following attributes: <ul>
   *   <li>highlights '=' - the highlights object representing the internal
   *     visualization status</li>
   *   <li>metric '=' - the data object to visualize</li>
   * </ul>
   * @constructor
   */
  AppMetricDirective = function() {
    this.require = ["^^appMetrics"];
    this.restrict = "E";
    this.templateUrl = "templates/AppMetric.html";
    this.scope = true;
    this.bindToController = {
      data: "=metric",
      highlights: "="
    };
    this.controllerAs = "appMetric";
    // create the controller based on the AppMetricController class
    options = {
      dataTransformer: AppHelper.getSeriesDataTransformer("time", "data"),
      ctrlName: this.controllerAs,
      graphType: "line"
    };
    this.controller = ["$scope", "$element",
        AppMetricController.getFactory(options)];
  };

  /**
   * Factory to create the directive; used as the angularjs.directive call.
   * @static
   */
  AppMetricDirective.factory = function() {
    return new AppMetricDirective();
  };

  /**
   * The "link" function to be invoked when the directive is attached to an
   * element. Will take care that the controller will draw the chart using the
   * AppChart methods.
   */
  AppMetricDirective.prototype.link = function( $scope, $element, $attrs,
                                                $controllers, $transclude ) {
    $scope.appMetric.link();
  };

  return AppMetricDirective;

});
