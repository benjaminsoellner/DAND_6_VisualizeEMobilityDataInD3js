var DATA_DIR = "data";
var SCENARIOS_FILE = "scenarios.json";

angular.module("app-emobviz", ["ngRoute"])

  .config(["$locationProvider", "$routeProvider", function($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('!');
    $routeProvider
      .when('/explain', {
        templateUrl: "views/explain.html",
        name: "Introduction to E-Mobility",
        id: "explain"
      })
      .when('/explore', {
        templateUrl: "views/explore.html",
        controller: "appExplore",
        reloadOnSearch: false,
        controllerAs: "view",
        name: "Explore Car Batteries!",
        id: "explore"
      })
      .when('/doc', {
        templateUrl: "views/doc.html",
        name: "Project Documentation",
        id: "doc"
      })
      .otherwise({
        redirectTo: "/explore"
      });
  }])

  .controller("appMain", ["$scope", "$route", function($scope, $route) {
    this.$route = $route;
    this.setRoutes = function() {
      var self = this;
      this.routes = [];
      ids = [];
      angular.forEach(self.$route.routes, function (route, path) {
        if (route.id !== undefined && !(route.id in ids)) {
          self.routes.push({
            path: path,
            id: route.id,
            name: route.name
          });
          ids.push(route.id);
        }
      });
    };
    this.updateCurrentRouteHandler = function() {
      var self = this;
      return function() {
        if (self.$route.current === undefined)
          self.currentRoute = undefined;
        else {
          self.currentRoute = {
            id: self.$route.current.id,
            name: self.$route.current.name
          };
        }
      };
    }
    this.setRoutes();
    this.updateCurrentRouteHandler()();
    $scope.$watch("main.$route.current", this.updateCurrentRouteHandler());

  }])

  .directive("appRoutes", [function() {
    return {
      restrict: "E",
      templateUrl: "assets/templates/app-mod-emobviz/app-routes.html",
      bindToController: {
        current: "=",
        all: "=",
        title: "@"
      },
      controllerAs: "routes",
      controller: function($scope, $element) {
      }
    };
  }])

  .controller("appExplore", ["$scope", "$http", "$location", function($scope, $http, $location) {
    this.loadScenarios = function(scenarioUrl) {
      $http.get(scenarioUrl).success(this.scenariosLoadedHandler());
    };
    this.loadMetrics = function(metricsUrl) {
      this.resetHighlights();
      $http.get(metricsUrl).success(this.metricsLoadedHandler());
    };
    this.resetHighlights = function() {
      if (!this.highlights) this.highlights = {};
      this.highlights.locationId = undefined;
      this.highlights.metric = undefined;
      this.highlights.time = undefined;
      this.highlights.locationValues = {};
    };
    this.metricsLoadedHandler = function() {
      var self = this;
      return function(data) {
        metrics = data;
        hotspots = [];
        for (metricIdx in metrics)
          metrics[metricIdx].graph = self.reshapeForGraph(metrics[metricIdx]);
        self.metrics = metrics;
      };
    }
    this.scenariosLoadedHandler = function() {
      var self = this;
      return function(data) {
        self.scenarios = data;
        self.processUrlScenarioId();
      };
    }
    this.selectedScenarioChangedHandler = function() {
      var self = this;
      return function() {
        self.resetHighlights();
        if (self.selectedScenario) {
          self.loadMetrics(self.dataDir + "/" + self.selectedScenario.dataFile);
          $location.search("scenarioId", self.selectedScenario.id);
        } else if (self.selectedScenario === undefined) {
          self.metrics = undefined;
          self.selectedMetrics = [];
          self.locations = [];
        }
      };
    };
    this.selectedMetricsChangedHandler = function() {
      var self = this;
      return function() {
        locations = [];
        for (metricIdx in self.selectedMetrics) {
          for (locationIdx in self.selectedMetrics[metricIdx].locations) {
            locations.push(self.selectedMetrics[metricIdx].locations[locationIdx])
          }
        }
        self.locations = locations;
      }
    };
    this.setMetricHighlighted = function(metric, value) {
      if (value)
        self.highlightedMetric = metric;
      else
        self.highlightedMetric = undefined;
    };
    this.reshapeForGraph = function(metric) {
      r = [];
      for (l in metric.locations) {
        for (i = 0; i < metric.locations[l].time.length; i++) {
          r.push({
            "location": l,
            "time": metric.locations[l].time[i],
            "data": metric.locations[l].data[i]
          });
        }
      }
      return r;
    }
    this.processUrlHandler = function() {
      var self = this;
      return function($event, $args) {
        self.processUrlScenarioId();
        self.processUrlStoryId();
      }
    }
    this.processUrlScenarioId = function() {
      var scenarioId = $location.search().scenarioId,
          scenario = undefined;
      for (i in this.scenarios)
        if (this.scenarios[i].id == scenarioId)
          scenario = this.scenarios[i];
      this.selectedScenario = scenario;
    }
    this.processUrlStoryId = function() {

    }
    // initialization:
    this.scenarios = [];
    this.selectedScenario = undefined;
    this.dataDir = DATA_DIR;
    this.scenariosFile = SCENARIOS_FILE;
    $scope.$watch("view.selectedScenario", this.selectedScenarioChangedHandler());
    $scope.$watch("view.selectedMetrics", this.selectedMetricsChangedHandler(), true);
    $scope.$on("$locationChangeSuccess", this.processUrlHandler());
    this.resetHighlights();
    this.loadScenarios(this.dataDir + "/" + this.scenariosFile);
  }])

  .directive("appDropdown", [function() {
    return {
      restrict: "E",
      templateUrl: "assets/templates/app-mod-emobviz/app-dropdown.html",
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
        this.locationValuesChangedHandler = function(values) {
          return function(values) {
            if (values) {
              $scope.$broadcast("locationValuesChanged", values);
            }
          }
        }
        // initialize
        $scope.$watch("schematics.highlights.locationValues", this.locationValuesChangedHandler(), true);
      },
    };
  }])

  .directive("appLocation", ["$compile", function($compile) {
    return {
      require: ["^^appSchematics"],
      transclude: true,
      restrict: "A",
      templateUrl: "assets/templates/app-mod-emobviz/app-location.html",
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
      templateUrl: "assets/templates/app-mod-emobviz/app-metrics.html",
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
      templateUrl: "assets/templates/app-mod-emobviz/app-metric.html",
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
