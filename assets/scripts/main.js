// setup dependencies to external libraries
require.config({
  baseUrl: 'assets/scripts',
  paths: {
    jquery: 'ext/jquery-1.12.2.min',
    bootstrap: 'ext/bootstrap/bootstrap.min',
    underscore: 'ext/underscore.min',
    d3: 'ext/d3.min',
    angular: 'ext/angular.min',
    angularRoute: 'ext/angular-route.min',
    elementQueries: 'ext/ElementQueries',
    resizeSensor: 'ext/ResizeSensor'
  },
  shim : {
    "bootstrap" : { "deps" : ["jquery"] },
    "angular": { "deps": ["jquery"] },
    "angularRoute": { "deps": ["angular"] },
    "elementQueries": { "deps": ["jquery"] },
    "resizeSensor": { "deps": ["jquery", "elementQueries"] }
  }
});

// pull in all requirejs modules ...
require(
    ["AppConfigurator", "AppMainController", "AppRoutesDirective",
      "AppExploreController", "AppDropdownDirective",
      "AppSchematicsDirective", "AppSeriesDirective", "AppMetricsDirective",
      "AppTranscopeDirective", "AppMetricDirective", "AppStoriesDirective",
      "AppExplainController", "AppSummaryDirective",
      "angular", "angularRoute", "bootstrap"],
    function(AppConfigurator, AppMainController, AppRoutesDirective,
          AppExploreController, AppDropdownDirective,
          AppSchematicsDirective, AppSeriesDirective, AppMetricsDirective,
          AppTranscopeDirective, AppMetricDirective, AppStoriesDirective,
          AppExplainController, AppSummaryDirective) {

      // ... and create an angular module from them all
      angular.module("app-dand6", ["ngRoute"])
        .config(["$locationProvider", "$routeProvider",
                    AppConfigurator.factory])
        .controller("appMain", ["$scope", "$route", AppMainController.factory])
        .directive("appRoutes", [AppRoutesDirective.factory])
        .controller("appExplore", ["$scope", "$http", "$location",
                    AppExploreController.factory])
        .directive("appDropdown", [AppDropdownDirective.factory])
        .directive("appSchematics", [AppSchematicsDirective.factory])
        .directive("appSeries", [AppSeriesDirective.factory])
        .directive("appMetrics", [AppMetricsDirective.factory])
        .directive("appTranscope", [AppTranscopeDirective.factory])
        .directive("appMetric", [AppMetricDirective.factory])
        .directive("appStories", [AppStoriesDirective.factory])
        .controller("appExplain", ["$scope", "$http", "$location",
                    AppExplainController.factory])
        .directive("appSummary", [AppSummaryDirective.factory]);

      // use manual bootstrapping to attach the module to the DOM
      angular.bootstrap(document, ['app-dand6']);

    }
  );
