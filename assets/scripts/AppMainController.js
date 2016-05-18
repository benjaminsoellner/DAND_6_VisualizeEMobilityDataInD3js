define([], function() {

  AppMainController = function($scope, $route) {
    this.$scope = $scope;
    this.$route = $route;
    this.setRoutes();
    this.updateCurrentRouteHandler()();
    $scope.$watch("main.$route.current", this.updateCurrentRouteHandler());
  }

  AppMainController.factory = function($scope, $route) {
    return new AppMainController($scope, $route);
  }

  AppMainController.prototype.setRoutes = function() {
    var self = this;
    this.routes = [];
    ids = [];
    angular.forEach(self.$route.routes, function (route, path) {
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
