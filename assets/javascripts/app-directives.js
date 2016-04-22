angular.module("app-directives", [])

  .directive("appDropdown", [function() {
    return {
      restrict: "E",
      templateUrl: "assets/templates/app-directives/app-dropdown.html",
      scope: {
        placeholder: "@",
        list: "=",
        selected: "=",
        property: "@",
        type: "@"
      },
      link: function($scope) {
        $scope.initialize = function() {
          $scope.isPlaceholder = true;
          if ($scope.type == undefined) $scope.type = "radio";
          $scope.$watch("selected", $scope.selectedChange, true);
        }
        $scope.select = function(item) {
          if ($scope.type == "radio") {
            $scope.selected = item;
          } else if ($scope.type == "checkbox") {
            index = $scope.selected.indexOf(item);
            if (index > -1)
              $scope.selected.splice(index, 1);
            else
              $scope.selected.push(item);
          }
        };
        $scope.isSelected = function(item) {
          if ($scope.type == "radio")
            return item == $scope.selected;
          else
            return ($scope.selected.indexOf(item) > -1);
        };
        $scope.selectedChange = function() {
          if ($scope.type == "radio") {
            $scope.isPlaceholder = ($scope.selected === undefined);
            if (!$scope.isPlaceholder)
              if (!$scope.property)
                $scope.display = $scope.selected;
              else
                $scope.display = $scope.selected[$scope.property];
          } else if ($scope.type == "checkbox") {
            $scope.isPlaceholder = ($scope.selected.length == 0);
            if (!$scope.property)
              $scope.display = $scope.selected.join(", ");
            else
              $scope.display = _.pluck($scope.selected, $scope.property).join(", ");
          }
        };
        $scope.initialize();
      }
    };
  }])

  .directive("appSchematics", ["$http", "$q", function($http, $q) {
    return {
      restrict: "E",
      template: '<ng-include src="self.getSrcUrl()" data-onload="self.loaded()" />',
      scope: {
        svg: "=",
        locations: "=",
        highlights: "=",
        dir: "@"
      },
      bindToController: true,
      controllerAs: "self",
      controller: function($scope, $element) {
        this.getHighlightedLocId = function() {
          return this.highlights.locationId;
        }
        this.setHighlightedLocId = function(value) {
          this.highlights.locationId = value;
        }
        this.getLocations = function() {
          return this.locations;
        }
        this.getSrcUrl = function() {
          return (this.dir ? this.dir + "/" : "")  + this.svg;
        };
        this.loaded = function($event) {
          svg = $element.find("svg");
          bbox = svg[0].getBBox();
          vbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
          svg[0].setAttribute("viewBox", vbox);
          svg[0].removeAttribute("height");
          svg[0].removeAttribute("width");
        }
      },
    };
  }])

  .directive("appLocation", [function() {
    return {
      require: ["^^appSchematics"],
      transclude: true,
      restrict: "A",
      templateUrl: "assets/templates/app-directives/app-location.html",
      scope: {
       appLocation: "@"
      },
      link: function($scope, $elem, $attrib, $controllers) {
        $scope.hasMetrics = function() {
          locations = $controllers[0].getLocations();
          for (locationIdx in locations)
            if (locations[locationIdx].id == $scope.appLocation)
                return true;
          return false;
        }
        $scope.isHighlighted = function() {
          highlightedLocId = $controllers[0].getHighlightedLocId();
          return ($scope.appLocation == highlightedLocId);
        }
        $scope.highlightLocation = function() {
          $controllers[0].setHighlightedLocId($scope.appLocation);
        }
        $scope.unhighlightLocation = function() {
          $controllers[0].setHighlightedLocId(false);
        }
      }
    };
  }])

  .directive("appMetrics", [function() {
    return {
      templateUrl: "assets/templates/app-directives/app-metrics.html",
      transclude: true,
      restrict: "E",
      scope: {
        metrics: "=",
        highlights: "="
      },
      controller: function($scope, $element) {
        var self = this;
        this.initialize = function() {
        };
        this.initialize();
      }
    };
  }])

  .directive("appTranscope", function() {
    return {
        link: function( $scope, $element, $attrs, $controllers, $transclude ) {
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
        }
    };
  })

  .directive("appMetric", ["$timeout", function($timeout) {
    return {
      require: ["^^appMetrics"],
      restrict: "E",
      templateUrl: "assets/templates/app-directives/app-metric.html",
      scope: false,
      bindToController: true,
      controllerAs: "self",
      controller: function($scope, $element) {
        this.initialize = function() {
          var self = this;
          $scope.$watch("highlights.locationId", function() { self.highlightsUpdated(self); } );
          $scope.$watch("highlights.metricId", function() { self.highlightsUpdated(self); } );
          $scope.$watch("highlights.timeRange", function() { self.timeRangeUpdated(self); } );
          $scope.$watch("highlights.time", function() { self.timeUpdated(self); });
          $scope.metricGraph = new MetricGraph( $element.find('.app-metric')[0],
              { xlabel: 'time', ylabel: $scope.metric.label } );
          $scope.metricGraph.dimensions(1.0, 4.0, 1.0, 6.0, false);
          $scope.metricGraph.attachSeriesHighlightedHandler(this.locationHighlighted);
          $scope.metricGraph.attachSeriesUnhighlightedHandler(this.locationUnhighlighted);
          $scope.metricGraph.attachMouseEnterHandler(this.metricHighlighted);
          $scope.metricGraph.attachMouseLeaveHandler(this.metricUnhighlighted);
          $scope.metricGraph.attachMouseLeaveHandler(this.timeUnhighlighted);
          $scope.metricGraph.attachMouseMovedHandler(this.timeHighlighted);
          $scope.metricGraph.attachDimensionsChangedHandler(this.timeRangeChanged);
          this.highlightsUpdated();
          this.dataUpdated();
        };
        this.dataUpdated = function(self) {
          if (!self) self = this;
          if ($scope.metricGraph) {
            $scope.metricGraph.bind($scope.metric, this.locationToSerieses);
          }
        };
        this.highlightsUpdated = function(self) {
          if (!self) self = this;
          if ($scope.metricGraph) {
            var colorMap =
            $scope.metricGraph.highlight({
              seriesId: $scope.highlights.locationId,
              colorMap: ($scope.metric.id == $scope.highlights.metricId) ?
                          $scope.metric.dataColorMap : false
            });
          }

        }
        this.timeRangeUpdated = function(self) {
          if ($scope.highlights.timeRange) {
            minX = $scope.highlights.timeRange[0];
            maxX = $scope.highlights.timeRange[1];
            $scope.metricGraph.dimensions(minX, maxX, undefined, undefined);
          }
        }
        this.timeUpdated = function(self) {
          if ($scope.highlights.time || $scope.highlights.time === false)
            $scope.metricGraph.highlight({
              x: $scope.highlights.time
            });
        }
        this.locationToSerieses = function(data) {
          return data.locations.map(
            function(location) {
              return {
                id: location.id,
                values: location.time.map(function(t, i) {
                  return { time: t, value: location.data[i] };
                })
              };
            });
        };
        this.locationHighlighted = function(locationId) {
          $scope.$apply(function() { $scope.highlights.locationId = locationId; });
        };
        this.locationUnhighlighted = function(locationId) {
          $scope.$apply(function() { $scope.highlights.locationId = false; });
        };
        this.metricHighlighted = function() {
          $scope.$apply(function() { $scope.highlights.metricId = $scope.metric.id; });
        };
        this.metricUnhighlighted = function() {
          $scope.$apply(function() { $scope.highlights.metricId = false; });
        };
        this.timeRangeChanged = function(minX, maxX, minY, maxY) {
          $scope.$apply(function() { $scope.highlights.timeRange = [minX, maxX]; });
        };
        this.timeHighlighted = function(x, y) {
          $scope.$apply(function() { $scope.highlights.time = x; });
        };
        this.timeUnhighlighted = function() {
          $scope.$apply(function() { $scope.highlights.time = false; });
        };
        this.initialize();
      }
    }
  }]);
