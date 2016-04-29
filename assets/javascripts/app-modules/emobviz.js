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
        templateUrl: "views/report.html",
        name: "Project Documentation",
        id: "report"
      })
      .otherwise({
        redirectTo: "/explain"
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
    };
    this.setRoutes();
    this.updateCurrentRouteHandler()();
    $scope.$watch("main.$route.current", this.updateCurrentRouteHandler());
  }])

  .directive("appRoutes", [function() {
    return {
      restrict: "E",
      templateUrl: "assets/templates/app-modules/routes.html",
      scope: true,
      bindToController: {
        current: "=",
        all: "=",
        title: "@"
      },
      controllerAs: "appRoutes",
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
    this.loadStories = function(storiesUrl) {
      $http.get(storiesUrl).success(this.storiesLoadedHandler());
    }
    this.resetHighlights = function() {
      if (!this.highlights) this.highlights = {};
      this.highlights.locationId = undefined;
      this.highlights.metric = undefined;
      this.highlights.time = undefined;
      this.highlights.timeRane = [];
      this.highlights.looseness = 0;
      this.highlights.locationValues = {};
    };
    this.selectMetricsById = function(metricsIds) {
      this.selectedMetrics = []
      for (i in this.metrics) {
        if (metricsIds.indexOf(this.metrics[i].id) != -1)
          this.selectedMetrics.push(this.metrics[i])
      }
    }
    this.metricsLoadedHandler = function() {
      var self = this;
      return function(data) {
        self.metrics = data;
      };
    };
    this.storiesLoadedHandler = function() {
      var self = this;
      return function(data) {
        self.stories = data;
        if (data.length > 0) {
          self.selectedStory = data[0];
          self.highlights.looseness = 0;
        }
        self.processUrlStoryId();
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
        if (self.selectedScenario !== undefined)
          $location.search("scenarioId", self.selectedScenario.id);
        if (self.selectedScenario) {
          self.loadMetrics(self.dataDir + "/" + self.selectedScenario.dataFile);
          self.loadStories(self.dataDir + "/" + self.selectedScenario.storiesFile);
        } else if (self.selectedScenario === undefined) {
          self.metrics = undefined;
          self.selectedMetrics = [];
          self.locations = [];
        }
      };
    };
    this.selectedStoryChangedHandler = function() {
      var self = this;
      return function() {
        if (self.selectedStory !== undefined)
          $location.search("storyId", self.selectedStory.id);
      }
    }
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
      var storyId = $location.search().storyId,
          story = undefined;
      if (this.stories && this.stories.length > 0) {
        for (i in this.stories)
          if (this.stories[i].id == storyId)
            story = this.stories[i];
        if (story === undefined && this.selectedStory === undefined)
          this.selectedStory = this.stories[0];
      }
    }
    // initialization:
    this.scenarios = [];
    this.selectedScenario = undefined;
    this.dataDir = DATA_DIR;
    this.scenariosFile = SCENARIOS_FILE;
    $scope.$watch("view.selectedScenario", this.selectedScenarioChangedHandler());
    $scope.$watch("view.selectedMetrics", this.selectedMetricsChangedHandler(), true);
    $scope.$watch("view.selectedStory", this.selectedStoryChangedHandler());
    $scope.$on("$locationChangeSuccess", this.processUrlHandler());
    this.resetHighlights();
    this.loadScenarios(this.dataDir + "/" + this.scenariosFile);
  }])

  .directive("appDropdown", [function() {
    return {
      restrict: "E",
      templateUrl: "assets/templates/app-modules/dropdown.html",
      scope: true,
      bindToController: {
        placeholder: "@",
        list: "=",
        selected: "=",
        property: "@",
        type: "@",
        changed: "&"
      },
      controllerAs: "appDropdown",
      controller: function($scope) {
        this.select = function(item) {
          if (this.type == "radio") {
            this.selected = item;
          } else if (this.type == "checkbox") {
            index = this.selected.indexOf(item);
            if (index > -1)
              this.selected.splice(index, 1);
            else
              this.selected.push(item);
          }
          this.changed();
        };
        this.isSelected = function(item) {
          if (this.type == "radio")
            return item == this.selected;
          else
            return (this.selected.indexOf(item) > -1);
        };
        this.selectedChangedHandler = function() {
          var self = this;
          return function() {
            if (self.type == "radio") {
              self.isPlaceholder = (self.selected === undefined);
              if (!self.isPlaceholder)
                if (!self.property)
                  self.display = self.selected;
                else
                  self.display = self.selected[self.property];
            } else if (self.type == "checkbox") {
              self.isPlaceholder = (self.selected.length == 0);
              if (!self.property)
                self.display = self.selected.join(", ");
              else
                self.display = _.pluck(self.selected, self.property).join(", ");
            }
          }
        };
        // initialization
        this.isPlaceholder = true;
        if (this.type == undefined) this.type = "radio";
        $scope.$watch("appDropdown.selected", this.selectedChangedHandler(), true);
      }
    };
  }])

  .directive("appSchematics", ["$http", "$q", function($http, $q) {
    return {
      restrict: "E",
      template: '<ng-include src="appSchematics.getSrcUrl()" data-onload="appSchematics.loaded()" />',
      bindToController: {
        svg: "=",
        locations: "=",
        highlights: "=",
        dir: "@"
      },
      controllerAs: "appSchematics",
      controller: function($scope, $element) {
        this.getHighlightedLocId = function() {
          return this.highlights.locationId;
        }
        this.setHighlightedLocId = function(value) {
          this.highlights.locationId = value;
          if (this.highlights.looseness < 1)
            this.highlights.looseness = 1;
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
        $scope.$watch("appSchematics.highlights.locationValues", this.locationValuesChangedHandler(), true);
      }
    };
  }])

  .directive("appLocation", ["$compile", function($compile) {
    return {
      require: ["^^appSchematics"],
      transclude: true,
      restrict: "A",
      templateUrl: "assets/templates/app-modules/location.html",
      scope: true,
      bindToController: {
        location: "@appLocation"
      },
      controllerAs: "appLocation",
      controller: function($scope, $element) {
        this.hasMetrics = function() {
          locations = this.schematics.getLocations();
          for (locationIdx in locations)
            if (locations[locationIdx].id == this.location)
                return true;
          return false;
        }
        this.isHighlighted = function() {
          highlightedLocId = this.schematics.getHighlightedLocId();
          return (this.location == highlightedLocId);
        }
        this.highlightLocation = function() {
          this.schematics.setHighlightedLocId(this.location);
        }
        this.unhighlightLocation = function() {
          this.schematics.setHighlightedLocId(false);
        }
        this.locationValuesChangedHandler = function() {
          var self = this;
          return function($event, values) {
            var value = undefined;
            for (i in values)
              if (values[i].id == self.location)
                value = values[i];
            if (value && value.color) {
              self.style.fill = value.color;
            } else {
              self.style.fill = undefined;
            }
          };
        }
        // initialization
        this.style = {fill: undefined};
        $scope.$on("locationValuesChanged", this.locationValuesChangedHandler());
      },
      link: function($scope, $element, $attrs, $controllers) {
        $scope.appLocation.schematics = $controllers[0];
        updatedChilds = $element.children().first().find("*")
          .attr("app-style","appLocation.style");
        $compile(updatedChilds)($scope);
      }
    };
  }])

  .directive("appStyle", ["$compile", function($compile) {
    return {
      restrict: "A",
      scope: true,
      bindToController: {
        style: "=appStyle"
      },
      controllerAs: "appStyle",
      priority: 100,
      controller: function($scope, $element) {
        this.styleChangedHandler = function() {
          var self = this;
          return function(style) {
            for (k in style) {
              if (style[k] === undefined && self.oldStyle[k]) {
                $element.css(k, self.oldStyle[k]);
              } else {
                $element.css(k, style[k]);
              }
            }
          };
        }
        // initialization
        this.oldStyle = {};
        for (k in this.style) this.oldStyle[k] = $element[0].style[k];
        $scope.$watch("appStyle.style", this.styleChangedHandler(), true);
      }
    }
  }])

  .directive("appMetrics", [function() {
    return {
      templateUrl: "assets/templates/app-modules/metrics.html",
      transclude: true,
      restrict: "E",
      scope: true,
      bindToController: {
        metrics: "=",
        highlights: "="
      },
      controllerAs: "appMetrics",
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
      templateUrl: "assets/templates/app-modules/metric.html",
      scope: {
        metric: "=",
        highlights: "="
      },
      bindToController: true,
      controllerAs: "appMetric",
      controller: function($scope, $element) {
        this.dataUpdated = function() {
          if (this.chart) {
            this.chart.bind(this.metric, this.locationsToSerieses);
          }
        };
        this.highlightsUpdatedHandler = function() {
          var self = this;
          return function() {
            if (self.chart) {
              var highlightThisGraph = (self.metric.id == self.highlights.metricId);
              self.chart.highlight({
                x: self.highlights.time,
                seriesId: self.highlights.locationId,
                colorMap: highlightThisGraph ? self.metric.dataColorMap : false,
                thisGraph: highlightThisGraph
              });
            }
          }
        }
        this.fitChart = function() {
          var minX = undefined, minY = undefined,
              maxX = undefined, maxY = undefined,
              rangeXNew = this.chart.getXExtent(0.5),
              rangeYNew = this.chart.getYExtent(0.5);
          if (this.highlights.timeRange) {
            minX = this.highlights.timeRange[0];
            maxX = this.highlights.timeRange[1];
            if (this.highlights.looseness > 1) {
              if (minX === undefined || rangeXNew[0] < minX)
                this.highlights.timeRange[0] = minX = rangeXNew[0];
              if (maxX === undefined || rangeXNew[1] > maxX)
                this.highlights.timeRange[1] = maxX = rangeXNew[1];
            }
          } else {
            this.highlights.timeRange = [undefined, undefined];
          }
          this.chart.dimensions(minX, maxX, rangeYNew[0], rangeYNew[1]);
        }
        this.timeRangeUpdatedHandler = function() {
          var self = this;
          return function() {
            if (self.highlights.timeRange) {
              minX = self.highlights.timeRange[0];
              maxX = self.highlights.timeRange[1];
              self.chart.dimensions(minX, maxX, undefined, undefined);
            }
          }
        }
        this.locationValuesUpdatedHandler = function() {
          var self = this;
          return function() {
            if (self.highlights.time !== undefined &&
                self.highlights.metricId === self.metric.id) {
              values = self.chart.getValuesForX(self.highlights.time);
              self.highlights.locationValues = values;
            }
          };
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
        this.locationHighlightedHandler = function() {
          var self = this;
          return function(locationId) {
            $scope.$apply(function() {
              self.highlights.locationId = locationId;
              if (self.highlights.looseness < 1)
                self.highlights.looseness = 1;
            });
          };
        };
        this.locationUnhighlightedHandler = function() {
          var self = this;
          return function(locationId) {
            $scope.$apply(function() {
              self.highlights.locationId = false;
              if (self.highlights.looseness < 1)
                self.highlights.looseness = 1;
            });
          };
        };
        this.metricHighlightedHandler = function() {
          var self = this;
          return function() {
            $scope.$apply(function() {
              self.highlights.metricId = self.metric.id;
              if (self.highlights.looseness < 1)
                self.highlights.looseness = 1;
            });
          };
        };
        this.metricUnhighlightedHandler = function() {
          var self = this;
          return function() {
            $scope.$apply(function() {
              self.highlights.metricId = false;
              if (self.highlights.looseness < 1)
                self.highlights.looseness = 1;
            });
          };
        };
        this.rangeChangedHandler = function() {
          var self = this;
          return function(minX, maxX, minY, maxY) {
            $scope.$apply(function() {
              self.highlights.timeRange = [minX, maxX];
              if (self.highlights.looseness < 3)
                self.highlights.looseness = 3;
            });
          };
        };
        this.timeHighlightedHandler = function() {
          var self = this;
          return function(x, y) {
            $scope.$apply(function() {
                self.highlights.time = x;
                if (self.highlights.looseness < 1)
                  self.highlights.looseness = 1;
              });
          };
        };
        this.timeUnhighlightedHandler = function() {
          var self = this;
          return function() {
            $scope.$apply(function() {
                self.highlights.time = false;
                self.highlights.locationValues = {};
                if (self.highlights.looseness < 1)
                  self.highlights.looseness = 1;
              });
          };
        };
        this.loosenessUpdatedHandler = function() {
          var self = this;
          return function() {
            if (self.highlights.looseness == 2) {
              self.highlights.timeRange = [undefined, undefined];
              self.fitChart();
            }
          }
        }
        // initialization
        chartOptions = {
          xlabel: 'time',
          xunit: 's',
          ylabel: this.metric.label,
          yunit: this.metric.unit
        };
        this.chart = new AppChart( $element.find('.app-metric')[0], chartOptions);
        this.chart.attachSeriesHighlightedHandler(this.locationHighlightedHandler());
        this.chart.attachSeriesUnhighlightedHandler(this.locationUnhighlightedHandler());
        this.chart.attachMouseEnterHandler(this.metricHighlightedHandler());
        this.chart.attachMouseLeaveHandler(this.metricUnhighlightedHandler());
        this.chart.attachMouseLeaveHandler(this.timeUnhighlightedHandler());
        this.chart.attachMouseMovedHandler(this.timeHighlightedHandler());
        this.chart.attachDimensionsChangedHandler(this.rangeChangedHandler());
        this.highlightsUpdatedHandler()();
        this.dataUpdated();
        this.fitChart();
        $scope.$watch("appMetric.highlights.locationId", this.highlightsUpdatedHandler());
        $scope.$watch("appMetric.highlights.metricId", this.highlightsUpdatedHandler());
        $scope.$watch("appMetric.highlights.metricId", this.locationValuesUpdatedHandler());
        $scope.$watch("appMetric.highlights.time", this.highlightsUpdatedHandler());
        $scope.$watch("appMetric.highlights.time", this.locationValuesUpdatedHandler());
        $scope.$watch("appMetric.highlights.timeRange", this.timeRangeUpdatedHandler());
        $scope.$watch("appMetric.highlights.looseness", this.loosenessUpdatedHandler());
      }
    }
  }])

  .directive("appStories", [function() {
    return {
      require: [],
      restrict: "E",
      templateUrl: "assets/templates/app-modules/stories.html",
      scope: {
        stories: "=",
        story: "=",
        highlights: "=",
        homeurl: "@",
        metricsselector: "&"
      },
      bindToController: true,
      controllerAs: "appStories",
      controller: function($scope, $element) {
        this.goToStory = function(storyId) {
          for (i in this.stories)
            if (this.stories[i].id == storyId) {
              this.story = this.stories[i];
              this.highlights.looseness = 0;
            }
        }
        this.tellStoryHandler = function() {
          var self = this;
          return function() {
            if (self.highlights.looseness < 2 && self.story) {
              if (self.story.metrics)
                self.metricsselector({metrics: self.story.metrics});
              if (self.story.timeRange)
                self.highlights.timeRange = self.story.timeRange;
              if (self.story.location)
                self.highlights.locationId = self.story.location;
              if (self.story.metric)
                self.highlights.metricId = self.story.metric;
              if (self.story.time)
                self.highlights.time = self.story.time;
            }
          }
        }
        // initialization
        $scope.$watch("appStories.highlights.looseness", this.tellStoryHandler());
        $scope.$watch("appStories.story", this.tellStoryHandler());
      }
    };
  }]);