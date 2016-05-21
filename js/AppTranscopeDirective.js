/**
 * Defines the ng-transcope directive - a directive to make the outer scope
 * available to elements transcluded by a directive; this allows us to re-use
 * the outer scope in the transcluded elements but have an isolated scope in the
 * template.
 * @module AppTranscopeDirective
 * @exports AppTranscopeDirective
 */
define([], function() {

  /**
   * Defines the ng-transcope directive that may be used as attribute or element
   * @constructor
   */
  AppTranscopeDirective = function() {
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   */
  AppTranscopeDirective.factory = function() {
    return new AppTranscopeDirective();
  };

  /**
   * Standard directive link making use of the supplied $transclude function
   */
  AppTranscopeDirective.prototype.link = function(
                      $scope, $element, $attrs, $controllers, $transclude ) {
    if ( !$transclude ) {
        throw minErr( 'ngTransclude' )( 'orphan',
            'Illegal use of ngTransclude directive in the template! ' +
            'No parent directive that requires a transclusion found. ' +
            'Element: {0}',
            startingTag( $element ));
    }
    var innerScope = $scope.$new();
    $transclude( innerScope, function( clone ) {
        $element.empty();
        $element.append( clone );
        $element.on( '$destroy', function() {
            innerScope.$destroy();
        });
    });
  };

  return AppTranscopeDirective;

});
