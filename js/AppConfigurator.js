/**
 * A module to isolate the AppConfigurator of the DAND6 angular application
 * The AppConfigurator configures the angular application location service and
 * thus takes care of routing URL requests to the application to the right
 * view
 * @module AppConfigurator
 * @exports AppConfigurator
 */
define([], function() {

  /**
   * The AppConfigurator defines the $location service of angular to redirect
   * the user to the correct angular view and sets up the navigational metadata
   * @constructor
   */
  AppConfigurator = function($location, $route) {
    $location.html5Mode(false);
    $location.hashPrefix('!');
    $route
      // Explanatory page
      .when('/explain', {
        templateUrl: "views/explain.html",
        controller: "appExplain",
        controllerAs: "appExplain",
        reloadOnSearch: false,
        name: "Introduction to E-Mobility",
        id: "explain"
      })
      // Exploratory page
      .when('/explore', {
        templateUrl: "views/explore.html",
        controller: "appExplore",
        controllerAs: "appExplore",
        reloadOnSearch: false,
        name: "Explore Car Batteries!",
        id: "explore"
      })
      // Readme
      .when('/readme', {
        redirectTo: "https://github.com/benjaminsoellner/DAND_6_VisualizeEMobilityDataInD3js/blob/master/README.md",
        name: "Project Documentation on GitHub",
        id: "readme"
      })
      // Documentation
      .when('/doc', {
        templateUrl: "views/doc.html",
        name: "Technical Documentation",
        id: "doc"
      })
      // Authors homepage
      .when('/benkku', {
        redirectTo: "http://www.benkku.com",
        name: "Visit www.benkku.com",
        id: "benkku"
      })
      // Default: homepage
      .otherwise({
        redirectTo: "/explain"
      });
  };

  /**
   * Factory method to create an AppConfigurator; used in angular.config(...)
   * @static
   */
  AppConfigurator.factory = function($location, $route) {
    return new AppConfigurator($location, $route);
  };

  return AppConfigurator;

});
