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
      template: '<ng-include src="schematics.getSrcUrl()" data-onload="schematics.loaded()" />',
      bindToController: {
        svg: "=",
        locations: "=",
        highlights: "=",
        dir: "@"
      },
      controllerAs: "schematics",
      controller: function($scope, $element) {
        this.initialize = function() {
          $scope.$watch("schematics.highlights.locationValues", this.locationValuesChanged, true);
        }
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
        this.loaded = function() {
          svg = $element.find("svg");
          bbox = svg[0].getBBox();
          vbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
          svg[0].setAttribute("viewBox", vbox);
          svg[0].removeAttribute("height");
          svg[0].removeAttribute("width");
        }
        this.locationValuesChanged = function(values) {
          if (values) {
            $scope.$broadcast("locationValuesChanged", values);
          }
        }
        this.initialize();
      },
    };
  }])

  .directive("appLocation", ["$compile", function($compile) {
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
        $scope.locationValuesChanged = function($event, values) {
          var elems = $elem.find("*");
          var value = undefined;
          for (i in values)
            if (values[i].id == $scope.appLocation)
              value = values[i];
          if (value) {
            $scope.appStyle.fill = value.color;
          } else {
            $scope.appStyle.fill = undefined;
          }
        }
        // initialization
        $scope.appStyle = {fill: undefined};
        $scope.$on("locationValuesChanged", $scope.locationValuesChanged);
        updatedChilds = $elem.children().first().find("*")
            .attr("app-style","appStyle");
        $compile(updatedChilds)($scope);
      }
    };
  }])

  .directive("appStyle", ["$compile", function($compile) {
    return {
      restrict: "A",
      scope: {
        appStyle: "="
      },
      priority: 100,
      link: function($scope, $elem, $attrib, $controllers) {
        $scope.oldStyle = {};
        for (k in $scope.appStyle)
          $scope.oldStyle[k] = $elem[0].style[k];
        $scope.$watch("appStyle",
          function(appStyle) {
            for (k in appStyle) {
              if (appStyle[k] === undefined && $scope.oldStyle[k]) {
                $elem.css(k, $scope.oldStyle[k]);
              } else {
                $elem.css(k, appStyle[k]);
              }
            }
          }, true);
          //updatedChilds = $elem.attr("ng-style","appStyle").removeAttr("app-style");
          //$compile(updatedChilds)($scope);
      }
    }
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
          chartOptions = {
            xlabel: 'time',
            xunit: 's',
            ylabel: $scope.metric.label,
            yunit: $scope.metric.unit
          };
          $scope.chart = new AppChart( $element.find('.app-metric')[0], chartOptions);
          $scope.chart.attachSeriesHighlightedHandler(this.locationHighlighted);
          $scope.chart.attachSeriesUnhighlightedHandler(this.locationUnhighlighted);
          $scope.chart.attachMouseEnterHandler(this.metricHighlighted);
          $scope.chart.attachMouseLeaveHandler(this.metricUnhighlighted);
          $scope.chart.attachMouseLeaveHandler(this.timeUnhighlighted);
          $scope.chart.attachMouseMovedHandler(this.timeHighlighted);
          $scope.chart.attachDimensionsChangedHandler(this.timeRangeChanged);
          this.highlightsUpdated();
          this.dataUpdated();
          this.fitChart();
        };
        this.dataUpdated = function(self) {
          if (!self) self = this;
          if ($scope.chart) {
            $scope.chart.bind($scope.metric, this.locationsToSerieses);
          }
        };
        this.highlightsUpdated = function(self) {
          if (!self) self = this;
          if ($scope.chart) {
            var highlightThisGraph = ($scope.metric.id == $scope.highlights.metricId);
            $scope.chart.highlight({
              seriesId: $scope.highlights.locationId,
              colorMap: highlightThisGraph ? $scope.metric.dataColorMap : false,
              thisGraph: highlightThisGraph
            });
          }

        }
        this.fitChart = function() {
          var minX = undefined, minY = undefined,
              maxX = undefined, maxY = undefined,
              rangeXNew = $scope.chart.getXExtent(0.5),
              rangeYNew = $scope.chart.getYExtent(0.5);

          if ($scope.highlights.timeRange) {
            minX = $scope.highlights.timeRange[0];
            maxX = $scope.highlights.timeRange[1];
          } else {
            $scope.highlights.timeRange = [undefined, undefined];
          }
          if (minX === undefined || rangeXNew[0] < minX)
            $scope.highlights.timeRange[0] = minX = rangeXNew[0];
          if (maxX === undefined || rangeXNew[1] > maxX)
            $scope.highlights.timeRange[1] = maxX = rangeXNew[1];
          $scope.chart.dimensions(minX, maxX, rangeYNew[0], rangeYNew[1]);
        }
        this.timeRangeUpdated = function(self) {
          if ($scope.highlights.timeRange) {
            minX = $scope.highlights.timeRange[0];
            maxX = $scope.highlights.timeRange[1];
            $scope.chart.dimensions(minX, maxX, undefined, undefined);
          }
        }
        this.timeUpdated = function(self) {
          if ($scope.highlights.time || $scope.highlights.time === false)
            $scope.chart.highlight({
              x: $scope.highlights.time
            });
        }
        this.locationsToSerieses = function(data) {
          return data.locations.map(
            function(location) {
              return {
                id: location.id,
                values: location.time.map(function(t, i) {
                  return { x: t, y: location.data[i] };
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
          values = $scope.chart.getValuesForX(x);
          $scope.$apply(function() {
              $scope.highlights.time = x;
              $scope.highlights.locationValues = values;
            });
        };
        this.timeUnhighlighted = function() {
          $scope.$apply(function() {
              $scope.highlights.time = false;
              $scope.highlights.locationValues = {};
            });
        };
        this.initialize();
      }
    }
  }]);
