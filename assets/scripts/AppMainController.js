/**
 * Main controller for the DAND6 angularjs application; makes sure that all
 * the navigational information from the route provider are in the main scope
 * @module AppMainController
 * @exports AppMainController
 */
define([], function() {

  /**
   * The main controller, populates the properties routes and
   * currentRoute which can be used to layout a navigation
   * @constructor
   */
  AppMainController = function($scope, $route) {
    this.$scope = $scope;
    this.$route = $route;
    this.setRoutes();
    this.updateCurrentRouteHandler()();
    $scope.$watch("main.$route.current", this.updateCurrentRouteHandler());
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   */
  AppMainController.factory = function($scope, $route) {
    return new AppMainController($scope, $route);
  };

  /**
   * Derive a navigational structure from the information stored in the angular
   * $route provider (see AppConfigurator, where this component is configured).
   * Put that navigational structure into the "routes" property of the
   * controller.
   * @see module:AppConfigurator~AppConfigurator
   */
  AppMainController.prototype.setRoutes = function() {
    var self = this;
    this.routes = [];
    ids = [];
    angular.forEach(self.$route.routes,
        function (route, path) {
          // only add an element to "routes" if it has an "id" we did not come
          // across yet
          if (route.id !== undefined && !(route.id in ids)) {
            self.routes.push({
              path: path,
              id: route.id,
              name: route.name
            });
            ids.push(route.id);
          }
        });
  };

  /**
   * Return callback to be invoked in case the currently selected page is
   * changed (that is, if $route.current changes). Callback will populate those
   * changes to the "currentRoute" property of the controller.
   */
  AppMainController.prototype.updateCurrentRouteHandler = function() {
    var self = this;
    return function() {
      if (self.$route.current === undefined)
        self.currentRoute = undefined;
      else {
        self.currentRoute = {
          id: self.$route.current.id,
          name: self.$route.current.name
        };
      }
    };
  };

  return AppMainController;

});
