/**
 * Exposes a controller to be used with AngularJS directives in order to draw
 * a visualization graph using the AppChart class & D3.js. The controller
 * takes care about feeding the angular.js variables from the directive into
 * the AppChart object and modifying them when interacting with the chart.
 * @module AppChartController
 * @exports AppChartController
 */
define(["AppChart"], function(AppChart) {

  /**
   * Sets up a controller to glue together the generic AppChart chart drawing
   * component with an AngularJS directive & scope. The directive that uses this
   * controller must bind the following scope variables to the controller: <ul>
   *   <li>highlights - the highlights object representing the internal
   *     visualization status</li>
   *   <li>data - the data object to visualize</li>
   * </ul>
   * @constructor
   * @param $scope the AngularJS scope of the directive where the chart should
   *   be placed.
   * @param $element the DOM element of the directive
   * @param ctrlName the name of the controller in the angularJS scope
   */
  AppChartController = function($scope, $element, ctrlName) {
    // the container object for AppChart is the first child of the directive
    this.container = $element.children().first()[0];
    // memorize scope since some callbacks will use $scope.$apply(...)
    this.$scope = $scope;
    // only carry over known options
    // attach handlers to "highlights" object
    n = ctrlName;
    $scope.$watch(n + ".highlights.x", this.highlightsUpdatedHandler());
    $scope.$watch(n + ".highlights.hotspots", this.highlightsUpdatedHandler());
    $scope.$watch(n + ".highlights.seriesId", this.highlightsUpdatedHandler());
  };

  /**
   * Returns the factory function of the controller. The factory is used in
   * the directives .controller property. You have to specify some "options"
   * to the factory. The factory callback returned will accept exactly two
   * parameters: $scope and $element.
   * @static
   * @param ctrlName the name of the controller object in the AngularJS scope
   */
  AppChartController.getFactory = function(ctrlName) {
    return function($scope, $element) {
      return new AppChartController($scope, $element, ctrlName);
    };
  };

  /**
   * This function must be called when the directive using this controller links
   * the directive to a DOM element. It takes care of actually drawing the
   * chart into the DOM element.
   * @param chartOptions the chart options to create the AppChart with
   * @param dataTransformer the data transform function to apply to the data
   *   before the chart is drawn
   */
  AppChartController.prototype.link = function(dataTransformer, chartOptions) {
    this.chartOptions = chartOptions;
    this.dataTransformer = dataTransformer;
    // define chart options based on supplied data
    // create AppChart object and wire callbacks from controller to it
    this.chart = new AppChart(this.container, this.chartOptions);
    this.chart.attachSeriesHighlightedHandler(
        this.seriesHighlightedHandler());
    this.chart.attachSeriesUnhighlightedHandler(
        this.seriesUnhighlightedHandler());
    this.chart.attachMouseLeaveHandler(
        this.xyUnhighlightedHandler());
    this.chart.attachMouseMovedHandler(
        this.xyHighlightedHandler());
    this.chart.attachZoomedPannedHandler(
        this.zoomedPannedHandler());
    // initialize highlights, bind data, rescale chart and redraw chart
    this.highlightsUpdatedHandler()();
    this.dataUpdated();
    this.fitChart();
    this.chart.draw();
  };

  /**
   * To be called if the data property of the associated data object in the
   * directive / controller is changed or initialized.
   */
  AppChartController.prototype.dataUpdated = function() {
    if (this.chart)
      this.chart.bind(this.data, this.dataTransformer);
  };

  /**
   * Returns a callback that can be invoked if the highlights object supplied
   * to the directive / controller is changed. Will delegate the highlight
   * change to the included AppChart object.
   */
  AppChartController.prototype.highlightsUpdatedHandler = function() {
    var self = this;
    return function() {
      if (self.chart) {
        self.chart.highlight({
          x: self.highlights.x,
          y: self.highlights.y,
          seriesId: self.highlights.seriesId,
          hotspots: self.highlights.hotspots
        });
      }
    }
  };

  /**
   * Initializes the display area (x- and y-axis domain) of the chart based
   * on whether the highlights object specifies an area the chart should
   * navigate to via the xRange property and base on whether the highlight
   * object's "looseness" property dictates that the chart should be re-fit
   * to the maximum viewable area.
   */
  AppChartController.prototype.fitChart = function() {
    var minX = undefined, maxX = undefined,
        minY = undefined, maxY = undefined,
        minXRange = undefined, maxXRange = undefined;
    // get the x-axis and y-axis extent of the data with a padding of 20% above
    // and below the maximum value
    var extentX = this.chart.getXExtent(0.2),
        extentY = this.chart.getYExtent(0.2);
    // if the highlights object speicifies an area, start with this
    if (this.highlights.xRange) {
      minXRange = this.highlights.xRange[0];
      maxXRange = this.highlights.xRange[1];
    }
    // check if we do have a valid range now based on the highlights object
    if (minXRange !== undefined && maxXRange !== undefined) {
      minX = minXRange;
      maxX = maxXRange;
      // if we also have looseness > 1, that is, we should NOT re-fit the chart
      // based on the data values extent unless no highlights.xRange property is
      // specified with either the minX or maxX extent
      if (this.highlights.looseness > 1) {
        if (minX === undefined || extentX[0] < minX)
          this.highlights.xRange[0] = minX = extentX[0];
        if (maxX === undefined || extentY[1] > maxX)
          this.highlights.xRange[1] = maxX = extentX[1];
      }
    } else {
      // if we do NOT have a valid range based on highlights, just use the
      // data extent
      minX = extentX[0];
      maxX = extentX[1];
    }
    // if values are constant along Y axis, we add a padding of +1/-1
    if (extentY[0] == extentY[1])
      this.chart.dimensions(minX, maxX, extentY[0]-1, extentY[1]+1);
    else
      this.chart.dimensions(minX, maxX, extentY[0], extentY[1]);
  };

  /**
   * Returns a callback that should be invoked every time the highlights.xRange
   * value is changed. Will take care that all charts scroll uniformely along
   * the x axis.
   */
  AppChartController.prototype.xRangeUpdatedHandler = function() {
    var self = this;
    return function() {
      if (self.highlights.xRange) {
        minX = self.highlights.xRange[0];
        maxX = self.highlights.xRange[1];
        self.chart.dimensions(minX, maxX, undefined, undefined);
      }
    }
  };

  /**
   * Returns a callback that should be invoked any time a series is highlighted.
   * The callback accepts exactly one parameter: the seriesId. Will take care
   * that the highlights object (seriesId and looseness) is updated accordingly.
   */
  AppChartController.prototype.seriesHighlightedHandler = function() {
    var self = this;
    return function(seriesId) {
      self.$scope.$apply(function() {
        self.highlights.seriesId = seriesId;
        if (self.highlights.looseness < 1)
          self.highlights.looseness = 1;
      });
    };
  };

  /**
  * Returns a callback that should be invoked any time a series is
  * unhighlighted. The callback accepts exactly one parameter: the seriesId.
  * Will take care that the highlights object (seriesId and looseness) is
  * updated accordingly.
  */
  AppChartController.prototype.seriesUnhighlightedHandler = function() {
    var self = this;
    return function(seriesId) {
      self.$scope.$apply(function() {
        self.highlights.seriesId = false;
        if (self.highlights.looseness < 1)
          self.highlights.looseness = 1;
      });
    };
  };

  /**
   * Returns a callback that should be invoked any time the x/y extent changes
   * because the user zooms or pans in the graph. Updates the highlights object
   * (xRange property) accordingly.
   */
  AppChartController.prototype.zoomedPannedHandler = function() {
    var self = this;
    return function(minX, maxX, minY, maxY) {
      self.$scope.$apply(function() {
        self.highlights.xRange = [minX, maxX];
      });
    };
  };

  /**
   * Returns a callback that should be invoked any time a x/y value in the
   * graph is highlighted (effectively, any time the mouse moves). Callback
   * will accept a x and y domain coordinate as its 2 parameters and update
   * highlights.x and highlights.y accordingly.
   */
  AppChartController.prototype.xyHighlightedHandler = function() {
    var self = this;
    return function(x, y) {
      self.$scope.$apply(function() {
          self.highlights.x = x;
          self.highlights.y = y;
          if (self.highlights.looseness < 1)
            self.highlights.looseness = 1;
        });
    };
  };

  /**
   * Returns a callback that should be invoked any time the mouse leaves the
   * graph area or no point at all is highlighted in the graph.
   */
  AppChartController.prototype.xyUnhighlightedHandler = function() {
    var self = this;
    return function() {
      self.$scope.$apply(function() {
          self.highlights.x = false;
          self.highlights.seriesesValues = {};
          if (self.highlights.looseness < 1)
            self.highlights.looseness = 1;
        });
    };
  };

  /**
   * Returns a callback that should be invoked any time the "looseness" value
   * of the highlights object is changed. The "looseness" value specifies
   * which amount of "guiding" the UI should enforce (looseness = 0:
   * storytelling mode, looseness 1 = storytelling mode with user
   * starting to explore the graph, looseness = 2: user has collapsed the
   * storytelling, looseness = 3: user has completely 'gone off on its own' and
   * selected other metrics, zoomed/panned in the graph etc.)
   */
  AppChartController.prototype.loosenessUpdatedHandler = function() {
    var self = this;
    return function() {
      if (self.highlights.looseness == 2) {
        self.highlights.xRange = [undefined, undefined];
        self.fitChart();
      }
    }
  };

  return AppChartController;
});
