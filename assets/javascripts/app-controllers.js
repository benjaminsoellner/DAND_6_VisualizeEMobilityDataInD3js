var DATA_DIR = "data";
var SCENARIOS_FILE = "scenarios.json";

function reshapeForGraph(metric) {
  r = [];
  for (l in metric.locations) {
    for (i = 0; i < metric.locations[l].time.length; i++) {
      r.push({
        "location": l,
        "time": metric.locations[l].time[i],
        "data": metric.locations[l].data[i]
      });
    }
  }
  return r;
}


angular.module("app-controllers", ["app-directives"])

  /*******
   ** APP EXPLORE CONTROLLER
   ******/
  .controller("appExplore", function($scope, $http) {
    $controller = this;

    this.initialize = function() {
      $scope.scenarios = [];
      $scope.selectedScenario = undefined;
      $scope.metrics = undefined;
      $scope.selectedMetrics = [];
      $scope.locations = [];
      $scope.dataDir = DATA_DIR;
      $scope.scenariosFile = SCENARIOS_FILE;
      $scope.$watch("selectedScenario", this.selectedScenarioChanged);
      $scope.$watch("selectedMetrics", this.selectedMetricsChanged, true);
      $controller.resetHighlights();
      $controller.loadScenarios($scope.dataDir + "/" + $scope.scenariosFile);
    }

    $controller.loadScenarios = function(scenarioUrl) {
      $http.get(scenarioUrl).success(
        function (data) {
          $scope.scenarios = data;
        });
    };

    $controller.loadMetrics = function(scenarioUrl) {
      $controller.resetHighlights();
      $http.get(scenarioUrl).success(
        function (data) {
          metrics = data;
          hotspots = [];
          for (metricIdx in metrics)
            metrics[metricIdx].graph = reshapeForGraph(metrics[metricIdx]);
          $scope.metrics = metrics;
        });
    };

    $controller.resetHighlights = function() {
      $scope.highlightedMetric = undefined;
      $scope.highlightedLocId = undefined;
      $scope.highlightedTime = undefined;
    };

    $controller.selectedScenarioChanged = function() {
      $controller.resetHighlights();
      if ($scope.selectedScenario)
        $controller.loadMetrics($scope.dataDir + "/" + $scope.selectedScenario.dataFile);
    };

    $controller.selectedMetricsChanged = function() {
      locations = [];
      for (metricIdx in $scope.selectedMetrics) {
        for (locationIdx in $scope.selectedMetrics[metricIdx].locations) {
          locations.push($scope.selectedMetrics[metricIdx].locations[locationIdx])
        }
      }
      $scope.locations = locations;
    };

    $controller.setMetricHighlighted = function(metric, value) {
      if (value)
        $scope.highlightedMetric = metric;
      else
        $scope.highlightedMetric = undefined;
    };

    $controller.initialize();
  });
  /*******
   ** /APP EXPLORE CONTROLLER
   ******/
