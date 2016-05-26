/**
 * Exposes the AngularJS code of the &lt;app-summary&gt; directive which
 * displays a summary / explanatory graph. Uses the AppChartController
 * controller/module to place an AppChart object in the element reserved by the
 * directive.
 * @module AppChartPanel
 * @exports AppChartPanel
 */
define(["AppHelper", "AppChartController", "AppConstants"],
      function(AppHelper, AppChartPanel, AppConstants) {

  /**
   * The &lt;app-summary&gt; directive. Supports the following attributes: <ul>
   *   <li>highlights '=' - the highlights object representing the internal
   *     visualization status</li>
   *   <li>data '=' - the data object to visualize</li>
   * </ul>
   * @constructor
   */
  AppSummaryDirective = function() {
    this.restrict = "E";
    this.scope = true;
    this.templateUrl = "templates/AppSummary.html";
    this.bindToController = {
      data: "=",
      highlights: "="
    };
    this.controllerAs = "appSummary";
    // create the controller based on the AppChartController class
    this.controller = ["$scope", "$element",
        AppChartController.getFactory(this.controllerAs)]
  };

  /**
   * Factory to create the controller; used as the .controller member of the
   * directive.
   * @static
   */
  AppSummaryDirective.factory = function() {
    return new AppSummaryDirective();
  };

  /**
   * The "link" function to be invoked when the directive is attached to an
   * element. Will take care that the controller will draw the chart using the
   * AppChart methods.
   */
  AppSummaryDirective.prototype.link = function( $scope, $element, $attrs,
                                                $controllers, $transclude ) {
    dataTransformer = AppHelper.getSeriesDataTransformer("x", "y", "time")
    chartOptions = {
      graphType: "scatter",
      baseDir: AppConstants.DATA_DIR,
      xlabel: $scope.appSummary.data.xlabel,
      xunit: $scope.appSummary.data.xunit,
      ylabel: $scope.appSummary.data.ylabel,
      yunit: $scope.appSummary.data.yunit,
      tlabel: $scope.appSummary.data.tlabel,
      tunit: $scope.appSummary.data.tunit,
      alpha: 0.05
    };
    $scope.appSummary.link(dataTransformer, chartOptions);
  };

  return AppSummaryDirective;

});
