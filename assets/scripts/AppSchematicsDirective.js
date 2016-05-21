/**
 * Defines the app-schematics directive that is used to display a SVG with
 * flexible content populated with series values from a visualization.
 * @module AppSchematicsDirective
 * @exports AppSchematicsDirective
 */
define([], function() {

  /**
   * The controller governing the directive's state and it's interaction with
   * the outside world.
   * @constructor
   * @param $scope a reference to the angularjs scope of the component
   * @param $element a reference to the element the component is assigned to
   */
  AppSchematicsController = function($scope, $element) {
    this.$element = $element;
    this.$scope = $scope;
    $scope.$watch("appSchematics.highlights.seriesesValues",
          this.seriesesValuesChangedHandler());
  };

  /**
   * Factory to create the controller; used as the .controller member of the
   * directive
   * @static
   * @param $scope a reference to the angularjs scope of the component
   * @param $element a reference to the element the component is assigned to
   */
  AppSchematicsController.factory = function($scope, $element) {
    return new AppSchematicsController($scope, $element);
  };

  /**
   * Retrieve the currently highlighted series - used by sub-controllers in
   * directives transcluded into this directive. These directives are not
   * necessarily aware of the highlights object supplied to the
   * app-schematics directive.
   */
  AppSchematicsController.prototype.getHighlightedSerId = function() {
    return this.highlights.seriesId;
  };

  /**
   * Set the currently highlighted series - used by sub-controllers in
   * directives transcluded into this directive. These directives are not
   * necessarily aware of the highlights object supplied to the
   * app-schematics directive.
   */
  AppSchematicsController.prototype.setHighlightedSerId = function(value) {
    this.highlights.seriesId = value;
    if (this.highlights.looseness < 1)
      this.highlights.looseness = 1;
  };

  /**
   * Returns the array of available serieses - used by sub-controllers in
   * directives transcluded into this directive. These directives are not
   * necessarily aware of the highlights object supplied to the
   * app-schematics directive.
   */
  AppSchematicsController.prototype.getSerieses = function() {
    return this.serieses;
  };

  /**
   * Return the source URL of the SVG graph to be displayed. This is
   * concatenated by the attribute "dir" and "svg" supplied to the directive.
   */
  AppSchematicsController.prototype.getSrcUrl = function() {
    return (this.dir ? this.dir + "/" : "")  + this.svg;
  };

  /**
   * Invoked if a SVG is loaded; trims the SVG from its whitespace and
   * populates it with the current series values.
   */
  AppSchematicsController.prototype.loaded = function() {
    svg = this.$element.find("svg");
    AppHelper.trimSvg(svg);
    this.$scope.$broadcast("seriesesValuesChanged", {});
  };

  /**
   * Returns callback that is invoked every time a other series values
   * are detected in the highlights object and will broadcast this as an
   * event to child scopes so that other directives can catch the event from
   * there without having knowledge about the highlights object.
   * @param values an array of series values
   */
  AppSchematicsController.prototype.seriesesValuesChangedHandler =
                                                      function(values) {
    var self = this;
    return function(values) {
      if (values) {
        self.$scope.$broadcast("seriesesValuesChanged", values);
      }
    }
  };

  /**
   * The &lt;app-schematics&gt;...&lt;app-schematics&gt; directive. Supports the
   * following attributes: <ul>
   *   <li>svg '=' - a variable holding the SVG URL to be displayed </li>
   *   <li>serieses '=' - an array of serieses with their properties</li>
   *   <li>highlights '=' - the highlights object to exchange information
   *      about the visualization highlight state</li>
   *   <li>dir '@' - the directory where the SVG URL (attribute 'svg') is
   *      based on</li>
   * </ul>
   * @constructor
   */
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
    this.controller = ["$scope", "$element", AppSchematicsController.factory];
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   * @param $scope a reference to the angularjs scope of the component
   */
  AppSchematicsDirective.factory = function() {
    return new AppSchematicsDirective();
  };

  return AppSchematicsDirective;

});
