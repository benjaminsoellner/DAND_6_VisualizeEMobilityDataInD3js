define([], function() {

  AppSchematicsController = function($scope, $element) {
    this.$element = $element;
    this.$scope = $scope;
    $scope.$watch("appSchematics.highlights.seriesesValues", this.seriesesValuesChangedHandler());
  }

  AppSchematicsController.factory = function($scope, $element) {
    return new AppSchematicsController($scope, $element);
  }

  AppSchematicsController.prototype.getHighlightedSerId = function() {
    return this.highlights.seriesId;
  };

  AppSchematicsController.prototype.setHighlightedSerId = function(value) {
    this.highlights.seriesId = value;
    if (this.highlights.looseness < 1)
      this.highlights.looseness = 1;
  };

  AppSchematicsController.prototype.getSerieses = function() {
    return this.serieses;
  };

  AppSchematicsController.prototype.getSrcUrl = function() {
    return (this.dir ? this.dir + "/" : "")  + this.svg;
  };

  AppSchematicsController.prototype.loaded = function() {
    svg = this.$element.find("svg");
    AppHelper.trimSvg(svg);
    this.$scope.$broadcast("seriesesValuesChanged", {});
  };

  AppSchematicsController.prototype.seriesesValuesChangedHandler = function(values) {
    var self = this;
    return function(values) {
      if (values) {
        self.$scope.$broadcast("seriesesValuesChanged", values);
      }
    }
  };

  AppSchematicsDirective = function() {
    this.restrict = "E";
    this.templateUrl = "assets/templates/AppSchematics.html";
    this.bindToController = {
      svg: "=",
      serieses: "=",
      highlights: "=",
      dir: "@"
    },
    this.controllerAs = "appSchematics";
    this.controller = AppSchematicsController.factory;
  };

  AppSchematicsDirective.factory = function() {
    return new AppSchematicsDirective();
  };

  return AppSchematicsDirective;

});
