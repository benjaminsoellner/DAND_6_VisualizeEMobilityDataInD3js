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
          $controllers[0].setHighlightedLocId(undefined);
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
          $scope.$watch("metrics", function() { self.metricsChanged(); }, true);
        };
        this.metricsChanged = function() {
          $scope.$broadcast("resetScale");
          $scope.$broadcast("rescale");
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

  .directive("appMetric", [function() {
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
          $scope.$watch("highlights.locationId", function() { self.dataUpdated(self) } );
          $scope.$on("resetScale", function() { self.resetScale() });
          $scope.$on("rescale", function() { self.visualUpdated(); });
          $scope.metricGraph = new MetricGraph(
              $element.find('.app-metric')[0],
              {
                xlabel: 'time', ylabel: $scope.metric.label,
                xmin: 1.0, xmax: 4.0, ymin: 1.0, ymax: 6.0
              }
            );
          $scope.metricGraph.attachLocationHighlightedHandler(this.locationHighlighted);
          $scope.metricGraph.attachLocationUnhighlightedHandler(this.locationUnhighlighted);
          this.dataUpdated();
        }
        this.dataUpdated = function(self) {
          if (!self) self = this
          if ($scope.metricGraph) {
            $scope.metricGraph.bind($scope.metric, $scope.highlights.locationId);
            $scope.metricGraph.scale();
            $scope.metricGraph.draw();
          }
        }
        this.resetScale = function() {
          $scope.metricGraph.resetScale();
        }
        this.visualUpdated = function() {
          $scope.metricGraph.scale();
          $scope.metricGraph.draw();
        }
        this.locationHighlighted = function(locationId) {
          $scope.$apply( function() {
            $scope.highlights.locationId = locationId;
          } );
        }
        this.locationUnhighlighted = function(locationId) {
          $scope.$apply( function() {
            $scope.highlights.locationId = undefined;
          } );
        }
        this.initialize();
      }
    }
  }]);
