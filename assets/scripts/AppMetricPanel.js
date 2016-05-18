define(["AppChartPanel"], function(AppChartPanel) {

  AppMetricPanel = function($scope, panelOptions, chartOptions) {
    AppChartPanel.call(this, $scope, panelOptions, chartOptions);
    this.chart.attachMouseEnterHandler(this.metricHighlightedHandler($scope));
    this.chart.attachMouseLeaveHandler(this.metricUnhighlightedHandler($scope));
    $scope.$watch(n + ".highlights.metricId", this.highlightsUpdatedHandler());
    $scope.$watch(n + ".highlights.metricId", this.seriesesValuesUpdatedHandler());
    $scope.$watch(n + ".highlights.x", this.seriesesValuesUpdatedHandler());
    $scope.$watch(n + ".highlights.xRange", this.xRangeUpdatedHandler());
    $scope.$watch(n + ".highlights.looseness", this.loosenessUpdatedHandler());
  };

  AppMetricPanel.prototype = Object.create(AppChartPanel.prototype);

  AppMetricPanel.prototype.highlightsUpdatedHandler = function() {
    var superHandler = AppChartPanel.prototype.highlightsUpdatedHandler.call(this);
    var self = this;
    return function() {
      superHandler();
      if (self.chart) {
        var highlightThisChart = (self.ctrl.data.id == self.ctrl.highlights.metricId);
        self.chart.highlight({
          thisChart: highlightThisChart
        });
      }
    }
  };

  AppChartPanel.prototype.seriesesValuesUpdatedHandler = function() {
    var self = this;
    return function() {
      anyPointHighlighted = self.ctrl.highlights.x;
      thisMetricHighlighted = (self.ctrl.highlights.metricId === self.ctrl.data.id);
      if (!anyPointHighlighted)
        self.ctrl.highlights.seriesesValues = {};
      else {
        var serieses = self.ctrl.data.serieses,
            values = self.chart.getNearest(self.ctrl.highlights.x, self.ctrl.highlights.y),
            currentValues = self.ctrl.highlights.seriesesValues;
            newValues = {};
        for (seriesId in currentValues)
          newValues[seriesId] = currentValues[seriesId];
        for (seriesId in values)
          newValues[seriesId] = values[seriesId];
        self.ctrl.highlights.seriesesValues = newValues;
      }
    };
  };

  AppMetricPanel.prototype.zoomedPannedHandler = function($scope) {
    var superHandler = AppChartPanel.prototype.zoomedPannedHandler.call(this, $scope);
    var self = this;
    return function(minX, maxX, minY, maxY) {
      superHandler(minX, maxX, minY, maxY);
      $scope.$apply(function() {
        if (self.ctrl.highlights.looseness < 3)
          self.ctrl.highlights.looseness = 3;
      });
    };
  };

  AppMetricPanel.prototype.metricHighlightedHandler = function($scope) {
    var self = this;
    return function() {
      $scope.$apply(function() {
        self.ctrl.highlights.metricId = self.ctrl.data.id;
        if (self.ctrl.highlights.looseness < 1)
          self.ctrl.highlights.looseness = 1;
      });
    };
  };

  AppMetricPanel.prototype.metricUnhighlightedHandler = function($scope) {
    var self = this;
    return function() {
      $scope.$apply(function() {
        self.ctrl.highlights.metricId = undefined;
        if (self.ctrl.highlights.looseness < 1)
          self.ctrl.highlights.looseness = 1;
      });
    };
  };

  return AppMetricPanel;
});
