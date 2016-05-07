AppSeriesManipulator = function(headElement, property) {
  this.headElement = headElement;
  this.property = property;
  this.retrieveDefaults();
}

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
}

AppSeriesTextManipulator = function(headElement) {
  AppSeriesManipulator.call(this, headElement, "text");
}

AppSeriesTextManipulator.prototype.retrieveDefaults = function() {
  this.defaultText = this.headElement.children().first()[0].textContent;
}

AppSeriesTextManipulator.prototype.setFromSeriesValue = function(seriesValue, highlight) {
  var value;
  if (seriesValue === undefined)
    value = this.defaultText;
  else
    value = Math.round(seriesValue.y*10)/10.0;
  this.headElement.children().first()[0].textContent = value;
}

AppSeriesDimensionManipulator = function(headElement, property) {
  AppSeriesManipulator.call(this, headElement, property);
}

AppSeriesDimensionManipulator.prototype.retrieveDefaults = function() {
  this.defaultValue = this.headElement[0].getAttribute(self.property);
}

AppSeriesDimensionManipulator.prototype.setFromSeriesValue = function(seriesValue, highlight) {
  if (seriesValue === undefined)
    value = this.defaultValue;
  else
    value = seriesValue.y;
  this.headElement[0].setAttribute(this.property, value);
}

AppSeriesColorManipulator = function(headElement, property) {
  AppSeriesManipulator.call(this, headElement, property);
}

AppSeriesColorManipulator.prototype.retrieveDefaults = function() {
  this.defaultColor = this.headElement[0].style[self.property];
}

AppSeriesColorManipulator.prototype.setFromSeriesValue = function(seriesValue, highlight) {
  if (seriesValue === undefined)
    value = this.defaultColor;
  else
    value = seriesValue.colorVal;
  this.headElement[0].style[this.property] = value;
}

AppSeriesClassManipulator = function(headElement, className) {
  this.className = className;
  AppSeriesManipulator.call(this, headElement, "");
}

AppSeriesClassManipulator.prototype.retrieveDefaults = function() {
}

AppSeriesClassManipulator.prototype.setFromSeriesValue = function(seriesValue, highlight) {
  if (seriesValue) {
    $(this.headElement).addClass(this.className + "-yes");
    $(this.headElement).removeClass(this.className + "-no");
  } else {
    $(this.headElement).removeClass(this.className + "-yes");
    $(this.headElement).addClass(this.className + "-no");
  }
  if (highlight) {
    $(this.headElement).addClass("highlight-yes");
    $(this.headElement).removeClass("highlight-no");
  } else {
    $(this.headElement).removeClass("highlight-yes");
    $(this.headElement).addClass("highlight-no");
  }
}

AppSeriesDirective = function() {
  this.require = ["^^appSchematics"],
  this.transclude = true,
  this.restrict = "A",
  this.scope = true,
  this.controllerAs = "appSeries",
  this.bindToController = {
      seriesExpr: "&appSeries"
    }
}

AppSeriesDirective.factory = function() {
  return new AppSeriesDirective();
}

AppSeriesDirective.prototype.controller = function($scope, $element) {
  this.setupManipulators = function(headElement) {
    propertiesToSerieses = this.seriesExpr();
    this.seriesesToManipulators = {};
    for (property in propertiesToSerieses) {
      seriesId = propertiesToSerieses[property];
      manipulator = AppSeriesManipulator.create(headElement, property);
      this.seriesesToManipulators[seriesId] = manipulator;
    }
  }
  this.invokeManipulatorsHandler = function() {
    var self = this;
    return function($event, seriesValues) {
      highlightedSeriesId = self.schematics.getHighlightedSerId();
      for (seriesId in self.seriesesToManipulators) {
        manipulator = self.seriesesToManipulators[seriesId];
        manipulator.setFromSeriesValue(seriesValues[seriesId], seriesId == highlightedSeriesId);
      }
    };
  }
}

AppSeriesDirective.prototype.link = function( $scope, $element, $attrs, $controllers, $transclude ) {
  $transclude($scope, function(clone) {
      $element.empty();
      $element.append(clone);
  });
  $scope.appSeries.schematics = $controllers[0];
  $scope.appSeries.setupManipulators($element);
  $scope.$on("seriesesValuesChanged", $scope.appSeries.invokeManipulatorsHandler());
}
