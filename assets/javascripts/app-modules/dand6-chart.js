AppChartPanel = function($scope, panelOptions, chartOptions) {
  this.panelOptions = panelOptions;
  this.ctrl = panelOptions.ctrl;
  this.chartOptions = chartOptions;
  this.chart = new AppChart(panelOptions.chartContainer, this.chartOptions);
  this.chart.attachSeriesHighlightedHandler(this.seriesHighlightedHandler($scope));
  this.chart.attachSeriesUnhighlightedHandler(this.seriesUnhighlightedHandler($scope));
  this.chart.attachMouseLeaveHandler(this.xyUnhighlightedHandler($scope));
  this.chart.attachMouseMovedHandler(this.xyHighlightedHandler($scope));
  this.chart.attachZoomedPannedHandler(this.zoomedPannedHandler($scope));
  this.highlightsUpdatedHandler()();
  this.dataUpdated(panelOptions.dataTransformer);
  this.fitChart();
  this.chart.draw();
  n = panelOptions.ctrlName;
  $scope.$watch(n + ".highlights.x", this.highlightsUpdatedHandler());
  $scope.$watch(n + ".highlights.hotspots", this.highlightsUpdatedHandler())
  $scope.$watch(n + ".highlights.x", this.seriesesValuesUpdatedHandler());
  $scope.$watch(n + ".highlights.seriesId", this.highlightsUpdatedHandler());
}

AppChartPanel.prototype.dataUpdated = function(dataTransformer) {
  if (this.chart)
    this.chart.bind(this.ctrl.data, dataTransformer);
};

AppChartPanel.prototype.highlightsUpdatedHandler = function() {
  var self = this;
  return function() {
    if (self.chart) {
      self.chart.highlight({
        x: self.ctrl.highlights.x,
        y: self.ctrl.highlights.y,
        seriesId: self.ctrl.highlights.seriesId,
        hotspots: self.ctrl.highlights.hotspots
      });
    }
  }
};

AppChartPanel.prototype.fitChart = function() {
  var minX = undefined, maxX = undefined,
      minY = undefined, maxY = undefined,
      minXRange = undefined, maxXRange = undefined,
      extentX = this.chart.getXExtent(0.2),
      extentY = this.chart.getYExtent(0.2);
  if (this.ctrl.highlights.xRange) {
    minXRange = this.ctrl.highlights.xRange[0];
    maxXRange = this.ctrl.highlights.xRange[1];
  }
  if (minXRange !== undefined && maxXRange !== undefined) {
    minX = minXRange;
    maxX = maxXRange;
    if (this.ctrl.highlights.looseness > 1) {
      if (minX === undefined || extentX[0] < minX)
        this.ctrl.highlights.xRange[0] = minX = extentX[0];
      if (maxX === undefined || extentY[1] > maxX)
        this.ctrl.highlights.xRange[1] = maxX = extentX[1];
    }
  } else {
    minX = extentX[0];
    maxX = extentX[1];
  }
  if (extentY[0] == extentY[1])
    this.chart.dimensions(minX, maxX, extentY[0]-1, extentY[1]+1);
  else
    this.chart.dimensions(minX, maxX, extentY[0], extentY[1]);
};

AppChartPanel.prototype.xRangeUpdatedHandler = function() {
  var self = this;
  return function() {
    if (self.ctrl.highlights.xRange) {
      minX = self.ctrl.highlights.xRange[0];
      maxX = self.ctrl.highlights.xRange[1];
      self.chart.dimensions(minX, maxX, undefined, undefined);
    }
  }
};

AppChartPanel.prototype.seriesHighlightedHandler = function($scope) {
  var self = this;
  return function(seriesId) {
    $scope.$apply(function() {
      self.ctrl.highlights.seriesId = seriesId;
      if (self.ctrl.highlights.looseness < 1)
        self.ctrl.highlights.looseness = 1;
    });
  };
};

AppChartPanel.prototype.seriesUnhighlightedHandler = function($scope) {
  var self = this;
  return function(seriesId) {
    $scope.$apply(function() {
      self.ctrl.highlights.seriesId = false;
      if (self.ctrl.highlights.looseness < 1)
        self.ctrl.highlights.looseness = 1;
    });
  };
};

AppChartPanel.prototype.zoomedPannedHandler = function($scope) {
  var self = this;
  return function(minX, maxX, minY, maxY) {
    $scope.$apply(function() {
      self.ctrl.highlights.xRange = [minX, maxX];
    });
  };
};

AppChartPanel.prototype.xyHighlightedHandler = function($scope) {
  var self = this;
  return function(x, y) {
    $scope.$apply(function() {
        self.ctrl.highlights.x = x;
        self.ctrl.highlights.y = y;
        if (self.ctrl.highlights.looseness < 1)
          self.ctrl.highlights.looseness = 1;
      });
  };
};

AppChartPanel.prototype.xyUnhighlightedHandler = function($scope) {
  var self = this;
  return function() {
    $scope.$apply(function() {
        self.ctrl.highlights.x = false;
        self.ctrl.highlights.seriesesValues = {};
        if (self.ctrl.highlights.looseness < 1)
          self.ctrl.highlights.looseness = 1;
      });
  };
};

AppChartPanel.prototype.loosenessUpdatedHandler = function() {
  var self = this;
  return function() {
    if (self.ctrl.highlights.looseness == 2) {
      self.ctrl.highlights.xRange = [undefined, undefined];
      self.fitChart();
    }
  }
};

AppMetricPanel = function($scope, panelOptions, chartOptions) {
  AppChartPanel.call(this, $scope, panelOptions, chartOptions);
  this.chart.attachMouseEnterHandler(this.metricHighlightedHandler($scope));
  this.chart.attachMouseLeaveHandler(this.metricUnhighlightedHandler($scope));
  $scope.$watch(n + ".highlights.metricId", this.highlightsUpdatedHandler());
  $scope.$watch(n + ".highlights.metricId", this.seriesesValuesUpdatedHandler());
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
