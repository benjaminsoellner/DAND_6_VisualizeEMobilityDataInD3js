define(["AppMetricPanel"], function(AppMetricPanel) {

  AppMetricController = function() {
  };

  AppMetricController.factory = function() {
    return new AppMetricController();
  };

  AppMetricDirective = function() {
    this.require = ["^^appMetrics"];
    this.restrict = "E";
    this.templateUrl = "assets/templates/AppMetric.html";
    this.scope = true;
    this.bindToController = {
      data: "=metric",
      highlights: "=",
    };
    this.controllerAs = "appMetric";
  };

  AppMetricDirective.factory = function() {
    return new AppMetricDirective();
  };

  AppMetricDirective.prototype.controller = function($scope, $element) {
    chartOptions = {
      xlabel: 'time',
      xunit: 's',
      ylabel: this.data.label,
      yunit: this.data.unit,
      metricId: this.data.id,
      colorMap: this.data.dataColorMap,
      graphType: "line"
    };
    panelOptions = {
      ctrl: this,
      ctrlName: "appMetric",
      chartContainer: $element.children().first()[0],
      dataTransformer: AppHelper.getSeriesDataTransformer("time", "data")
    };
    this.panel = new AppMetricPanel($scope, panelOptions, chartOptions);
  };

  return AppMetricDirective;

});
