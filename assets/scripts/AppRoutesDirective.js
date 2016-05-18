define(["bootstrap"], function() {

  AppRoutesController = function() {
  }

  AppRoutesController.factory = function() {
    return new AppRoutesController();
  }

  AppRoutesDirective = function() {
    this.restrict = "E";
    this.templateUrl = "assets/templates/AppRoutes.html";
    this.scope = true;
    this.bindToController = {
      current: "=",
      all: "=",
      title: "@"
    };
    this.controllerAs = "appRoutes";
    this.controller = AppRoutesController.factory;
  };

  AppRoutesDirective.factory = function() {
    return new AppRoutesDirective();
  };

  return AppRoutesDirective;

});
