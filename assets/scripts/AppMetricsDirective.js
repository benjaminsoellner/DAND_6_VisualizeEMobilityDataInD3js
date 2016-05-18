define([], function() {

  AppMetricsController = function() {
  };

  AppMetricsController.factory = function() {
    return new AppMetricsController();
  };

  AppMetricsDirective = function() {
    this.templateUrl = "assets/templates/AppMetrics.html";
    this.transclude = true;
    this.restrict = "E";
    this.scope = true;
    this.bindToController = {
        metrics: "=",
        highlights: "="
      };
    this.controllerAs = "appMetrics";
    this.controller = AppMetricsController.factory;
  };

  AppMetricsDirective.factory = function() {
    return new AppMetricsDirective();
  };

  return AppMetricsDirective;

});
