/**
 * Defines the app-routes directive that is used to display a navigation
 * @module AppRoutesDirective
 * @exports AppRoutesDirective
 */
define(["bootstrap"], function() {

  /**
   * The controller governing the directive's state and it's interaction with
   * the outside world.
   * @constructor
   */
  AppRoutesController = function() {
  }

  /**
   * Factory to create the controller; used as the .controller member of the
   * directive
   * @static
   */
  AppRoutesController.factory = function() {
    return new AppRoutesController();
  }

  /**
   * The &lt;app-routes&gt;...&lt;app-routes&gt; directive. Supports the
   * following attributes: <ul>
   *   <li>current '=' - a variable containing the current route</li>
   *   <li>all '=' - a variable containing all current routes</li>
   *   <li>title '@' - a string to show as a header of the navigation</li>
   * </ul>
   * See AppConfigurator.js for a detailled description of the routes objects
   * @constructor
   */
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
    this.controller = [AppRoutesController.factory];
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   */
  AppRoutesDirective.factory = function() {
    return new AppRoutesDirective();
  };

  return AppRoutesDirective;

});
