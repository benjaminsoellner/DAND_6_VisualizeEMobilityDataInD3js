define(["AppHelper", "AppChartPanel"], function(AppHelper, AppChartPanel) {

  AppSummaryDirective = function() {
    this.restrict = "E";
    this.scope = true;
    this.templateUrl = "assets/templates/AppSummary.html";
    this.bindToController = {
      data: "=",
      highlights: "="
    };
    this.controllerAs = "appSummary";
  };

  AppSummaryDirective.factory = function() {
    return new AppSummaryDirective();
  };

  AppSummaryDirective.prototype.controller = function($scope, $element) {
    chartOptions = {
      xlabel: this.data.xlabel,
      xunit: this.data.xunit,
      ylabel: this.data.ylabel,
      yunit: this.data.yunit,
      seriesId: this.data.id,
      tlabel: "time",
      tunit: "s",
      graphType: "scatter",
      alpha: 0.05
    };
    panelOptions = {
      ctrl: this,
      ctrlName: "appSummary",
      chartContainer: $element.children().first()[0],
      dataTransformer: AppHelper.getSeriesDataTransformer("x", "y", "time")
    };
    this.panel = new AppChartPanel($scope, panelOptions, chartOptions);
  };

  return AppSummaryDirective;

});
