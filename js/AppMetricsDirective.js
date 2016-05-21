/**
 * Defines the &lt;app-metrics&gt;...&lt;/app-metrics&gt; directive which serves
 * as a container for many &lt;app-metric /&lt; directives, each displaying a
 * metric chart.
 * @module AppMetricsDirective
 * @exports AppMetricsDirective
 */
define([], function() {


  /**
   * The controller governing the directive's state and it's interaction with
   * the outside world.
   * @constructor
   */
  AppMetricsController = function() {
  };

  /**
   * Factory to create the controller; used as the .controller member of the
   * directive.
   * @static
   */
  AppMetricsController.factory = function() {
    return new AppMetricsController();
  };

  /**
   * Defines the &lt;app-metrics&gt;...&lt;/app-metrics&gt; directive. Accepts
   * the following attributes:<ul>
   * <li>metrics '=' - reference to a metrics object containing all displayable
   *   metrics</li>
   * <li>highlights '=' - reference to a highlights object holding the current
   *   interaction &amp; display state of the visualization.</li>
   * </ul>
   * @constructor
   */
  AppMetricsDirective = function() {
    this.templateUrl = "templates/AppMetrics.html";
    this.transclude = true;
    this.restrict = "E";
    this.scope = true;
    this.bindToController = {
        metrics: "=",
        highlights: "="
      };
    this.controllerAs = "appMetrics";
    this.controller = [AppMetricsController.factory];
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   */
  AppMetricsDirective.factory = function() {
    return new AppMetricsDirective();
  };

  return AppMetricsDirective;

});
