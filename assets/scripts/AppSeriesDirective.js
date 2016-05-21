/**
 * Defines the app-series directive that may be used inside of a SVG to
 * set certain SVG attributes dynamically based on series values. The
 * app-series directive needs to be applied to a SVG node as an attribute in
 * the form
 * app-series="&#123;property1: seriesId1, property2: seriesId2, ...&#125;"
 * where propertyN is a property you want to control dynamically and seriesIdN
 * is a series id you want to use in order to configure that property.
 * @module AppSeriesDirective
 * @exports AppSeriesDirective
 */
define([], function() {

  /**
   * General purpose "series manipulator". Each property-series pairing defined
   * by an app-series directive will have a manipulator associated on the DOM
   * element. The manipulator is responsible for receiving a series value and
   * modifying the DOM element accordingly
   * @abstract
   * @constructor
   * @param headElement the DOM element the manipulator has to control
   * @param property the property of the DOM element that this manipulator
   *   controls
   */
  AppSeriesManipulator = function(headElement, property) {
    this.headElement = headElement;
    this.property = property;
    // memorize defaults so we can always go back to them
    this.retrieveDefaults();
  };

  /**
   * Factory method to create a specific manipulator based on the property
   * @static
   * @param headElement the DOM element the manipulator has to control
   * @param property the property of the DOM element that this manipulator
   *   controls
   */
  AppSeriesManipulator.create = function(headElement, property) {
    switch (property) {
      case "text":
        return new AppSeriesTextManipulator(headElement);
      case "height": case "width":
        return new AppSeriesDimensionManipulator(headElement, property);
      case "fill":
        return new AppSeriesColorManipulator(headElement, property);
      case "show":
        return new AppSeriesClassManipulator(headElement, "show");
    }
  };

  /**
   * Manipulates a text content of a SVG DOM node based on the series value
   * it receives.
   * @constructor
   * @extends module:AppSeriesDirective~AppSeriesManipulator
   * @param headElement the DOM element the manipulator has to control
   */
  AppSeriesTextManipulator = function(headElement) {
    AppSeriesManipulator.call(this, headElement, "text");
  };
  AppSeriesTextManipulator.prototype =
      Object.create(AppSeriesManipulator.prototype);

  /**
   * Retrieve the default text content.
   */
  AppSeriesTextManipulator.prototype.retrieveDefaults = function() {
    this.defaultText = this.headElement.children().first()[0].textContent;
  };

  /**
   * Sets the text content to numerical value based on a series value
   * @param seriesValue the seriesValue, if undefined, resets value to
   *   unmanipulated default value
   * @param highlight whether the series associated with the series value is
   *   currently highlighted
   */
  AppSeriesTextManipulator.prototype.setFromSeriesValue = function(seriesValue,
                                                                  highlight) {
    var value;
    if (seriesValue === undefined)
      value = this.defaultText;
    else
      value = Math.round(seriesValue.y*10)/10.0;
    this.headElement.children().first()[0].textContent = value;
  };

  /**
   * Manipulates a dimension (width, height...) of a SVG DOM node based on the
   * series value it receives. Note, that the dimension will be assigned from
   * the series value "as-is" without any scaling etc., so you have to figure
   * out how to apply some SVG transform, scaling or SVG's viewbox attribute.
   * @constructor
   * @extends module:AppSeriesDirective~AppSeriesManipulator
   * @param headElement the DOM element the manipulator has to control
   * @param property the property of the DOM element that this manipulator
   *   controls; must be an attribute of the DOM element
   */
  AppSeriesDimensionManipulator = function(headElement, property) {
    AppSeriesManipulator.call(this, headElement, property);
  };
  AppSeriesDimensionManipulator.prototype =
      Object.create(AppSeriesManipulator.prototype);

  /**
   * Retrieve the default element's dimension.
   */
  AppSeriesDimensionManipulator.prototype.retrieveDefaults = function() {
    this.defaultValue = this.headElement[0].getAttribute(self.property);
  };

  /**
   * Sets the dimension of the manipulated DOM element based on the y value of
   * the series value
   * @param seriesValue the seriesValue, if undefined, resets value to
   *   unmanipulated default value
   * @param highlight whether the series associated with the series value is
   *   currently highlighted
   */
  AppSeriesDimensionManipulator.prototype.setFromSeriesValue =
                                      function(seriesValue, highlight) {
    if (seriesValue === undefined)
      value = this.defaultValue;
    else
      value = seriesValue.y;
    this.headElement[0].setAttribute(this.property, value);
  };

  /**
   * Manipulates a color (fill, stroke...) of a SVG DOM node based on the
   * series value it receives. The value will be drawn from the d.color value.
   * The property must be inside of the DOM's "style...." namespace
   * @constructor
   * @extends module:AppSeriesDirective~AppSeriesManipulator
   * @param headElement the DOM element the manipulator has to control
   * @param property the property of the DOM element that this manipulator
   *   controls; must be an attribute of the DOM element
   */
  AppSeriesColorManipulator = function(headElement, property) {
    AppSeriesManipulator.call(this, headElement, property);
  };
  AppSeriesColorManipulator.prototype =
      Object.create(AppSeriesManipulator.prototype);

  /**
   * Retrieve the default element's color.
   */
  AppSeriesColorManipulator.prototype.retrieveDefaults = function() {
    this.defaultColor = this.headElement[0].style[self.property];
  };

  /**
   * Sets the color of the manipulated DOM element based on the color value of
   * the series value
   * @param seriesValue the seriesValue, if undefined, resets value to
   *   unmanipulated default value
   * @param highlight whether the series associated with the series value is
   *   currently highlighted
   */
  AppSeriesColorManipulator.prototype.setFromSeriesValue =
                                            function(seriesValue, highlight) {
    if (seriesValue === undefined)
      value = this.defaultColor;
    else
      value = seriesValue.colorVal;
    this.headElement[0].style[this.property] = value;
  };

  /**
   * Manipulates the CSS class of a SVG DOM node based on whether it receives
   * values from the specified series and depending on whether it this series
   * is highlighted or a not.
   * @constructor
   * @extends module:AppSeriesDirective~AppSeriesManipulator
   * @param headElement the DOM element the manipulator has to control
   * @param className the class name with suffix "-yes" or "-no" to apply to
   *   the element based on whether the element currently receives data from
   *   the series it is assigned to.
   */
  AppSeriesClassManipulator = function(headElement, className) {
    this.className = className;
    AppSeriesManipulator.call(this, headElement, "");
  };
  AppSeriesClassManipulator.prototype =
      Object.create(AppSeriesClassManipulator.prototype);

  /**
   * Empty for this subclass.
   * @function AppSeriesClassManipulator.prototype.retrieveDefaults
   */
  AppSeriesClassManipulator.prototype.retrieveDefaults = function() {
  };

  /**
   * Sets the CSS classes of the SVG DOM node based on whether the DOM node
   * currently receives values from the configured series and based on whether
   * this series is currently highlighted.
   * @param seriesValue the seriesValue, if undefined, resets value to
   *   unmanipulated default value
   * @param highlight whether the series associated with the series value is
   *   currently highlighted
   */
  AppSeriesClassManipulator.prototype.setFromSeriesValue =
                                            function(seriesValue, highlight) {
    // set the class based on whether we receive valid values
    if (seriesValue) {
      $(this.headElement).addClass(this.className + "-yes");
      $(this.headElement).removeClass(this.className + "-no");
    } else {
      $(this.headElement).removeClass(this.className + "-yes");
      $(this.headElement).addClass(this.className + "-no");
    }
    // set the class based on whether this series is currently highlighted
    if (highlight) {
      $(this.headElement).addClass("highlight-yes");
      $(this.headElement).removeClass("highlight-no");
    } else {
      $(this.headElement).removeClass("highlight-yes");
      $(this.headElement).addClass("highlight-no");
    }
  };

  /**
   * The controller governing the directive's state and it's interaction with
   * the outside world.
   * @constructor
   * @param $scope a reference to the angularjs scope of the component
   * @param $element a reference to the element the component is assigned to
   */
  AppSeriesController = function($scope, $element) {
  };

  /**
   * Factory to create the controller; used as the .controller member of the
   * directive.
   * @static
   * @param $scope a reference to the angularjs scope of the component
   * @param $element a reference to the element the component is assigned to
   */
  AppSeriesController.factory = function($scope, $element) {
    return new AppSeriesController($scope, $element);
  };

  /**
   * Setup all manipulators based on the directive's value
   * @param $element a reference to the DOM head element the component is
   *   assigned to
   */
  AppSeriesController.prototype.setupManipulators = function(headElement) {
    propertiesToSerieses = this.seriesExpr();
    this.seriesesToManipulators = {};
    for (property in propertiesToSerieses) {
      seriesId = propertiesToSerieses[property];
      manipulator = AppSeriesManipulator.create(headElement, property);
      this.seriesesToManipulators[seriesId] = manipulator;
    }
  };

  /**
   * Returns a callback to be invoked every time the populated serieses values
   * was changed. The callback will accept two arguments: $event, representing
   * the associated angularjs event which is broadcasted from the parent scope
   * every time the serieses values changed and seriesValues, representing the
   * new serieses values that were populated.
   */
  AppSeriesController.prototype.invokeManipulatorsHandler = function() {
    var self = this;
    return function($event, seriesValues) {
      // currently highlighted series can be obtained from parent controller
      highlightedSeriesId = self.schematics.getHighlightedSerId();
      // for every populated series value, invoke the associated manipulator
      for (seriesId in self.seriesesToManipulators) {
        manipulator = self.seriesesToManipulators[seriesId];
        manipulator.setFromSeriesValue(seriesValues[seriesId],
            seriesId == highlightedSeriesId);
      }
    };
  };

  /**
   * The app-series directive used to decorate a SVG element to be modified if
   * new data series values are populated from the parent scope. The directive
   * can be applied to a SVG DOM element as attribute and takes a JSON object
   * in the form of &#123;property1: seriesId1, property2: seriesId2, ...&#125;
   * where propertyN is a property you want to control dynamically and seriesIdN
   * is a series id you want to use in order to configure that property. For
   * propertyN, there are various properties you can control, e.g., 'fill'
   * controls the filling color, 'text' controls the text inside of the element,
   * 'show' shows/hides the element based on whether values are present or not.
   * @constructor
   */
  AppSeriesDirective = function() {
    this.require = ["^^appSchematics"],
    this.transclude = true,
    this.restrict = "A",
    this.scope = true,
    this.controllerAs = "appSeries";
    this.bindToController = {
        seriesExpr: "&appSeries" // binding the attribute value
      };
    this.controller = ["$scope", "$element", AppSeriesController.factory];
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   */
  AppSeriesDirective.factory = function() {
    return new AppSeriesDirective();
  };

  /**
   * The directives 'link' function is invoked every time the directive is
   * bound to a DOM element. It makes sure that the directive still silently
   * transcludes the inner elements of the head DOM element, passes through the
   * angular.js scope and registers for any broadcasted seriesesValueChanged
   * event.
   */
  AppSeriesDirective.prototype.link = function( $scope, $element, $attrs,
                                                $controllers, $transclude ) {
    // transclude child elements, but don't create a child scope for them;
    // this allows nesting of app-series directives, all reacting to the same
    // seriesesValuesChanged events.
    $transclude($scope, function(clone) {
        $element.empty();
        $element.append(clone);
    });
    // save the app-schematics controller to the scope; this lets us invoke
    // functions from the app-schematics controller API
    $scope.appSeries.schematics = $controllers[0];
    // create all manipulator objects based on the directives argument
    $scope.appSeries.setupManipulators($element);
    // react to any "seriesesValuesChanged" events populated from parent scope
    // (that is, the app-schematics controller)
    $scope.$on("seriesesValuesChanged",
                $scope.appSeries.invokeManipulatorsHandler());
  };

  return AppSeriesDirective;
});
