define([], function() {

  AppConfigurator = function($location, $route) {
    $location.html5Mode(false);
    $location.hashPrefix('!');
    $route
      .when('/explain', {
        templateUrl: "views/explain.html",
        controller: "appExplain",
        controllerAs: "appExplain",
        reloadOnSearch: false,
        name: "Introduction to E-Mobility",
        id: "explain"
      })
      .when('/explore', {
        templateUrl: "views/explore.html",
        controller: "appExplore",
        controllerAs: "appExplore",
        reloadOnSearch: false,
        name: "Explore Car Batteries!",
        id: "explore"
      })
      .when('/doc', {
        templateUrl: "views/report.html",
        name: "Project Documentation",
        id: "report"
      })
      .otherwise({
        redirectTo: "/explain"
      });
  }

  AppConfigurator.factory = function($location, $route) {
    return new AppConfigurator($location, $route);
  }

  return AppConfigurator;
  
});
