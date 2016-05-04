var DATA_DIR = "data";
var SCENARIOS_FILE = "scenarios.json";
var SUMMARY_FILE = "summary.json";

AppHelper = {};

AppHelper.getSeriesDataTransformer = function(xKey, yKey) {
  return function(data) {
    return data.serieses.map(function(series) {
        series.values = [];
        for (var i = 0; i < series[xKey].length; i++)
          series.values.push({ x: series[xKey][i], y: series[yKey][i] });
        return series;
      });
  }
};

AppHelper.trimSvg = function(svg) {
  bbox = svg[0].getBBox();
  vbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
  svg[0].setAttribute("viewBox", vbox);
  svg[0].removeAttribute("height");
  svg[0].removeAttribute("width");
}

angular.module("app-dand6", ["ngRoute"])

  .config(["$locationProvider", "$routeProvider", function($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('!');
    $routeProvider
      .when('/explain', {
        templateUrl: "views/explain.html",
        controller: "appExplain",
        controllerAs: "appExplain",
        name: "Introduction to E-Mobility",
        id: "explain"
      })
      .when('/explore', {
        templateUrl: "views/explore.html",
        controller: "appExplore",
        controllerAs: "appExplore",
        reloadOnSearch: false,
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
      this.highlights.seriesId = undefined;
      this.highlights.metric = undefined;
      this.highlights.time = undefined;
      this.highlights.timeRange = [undefined, undefined];
      this.highlights.looseness = 0;
      this.highlights.seriesesValues = {};
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
        self.metrics = undefined;
        self.stories = undefined;
        self.selectedMetrics = [];
        self.serieses = [];
        self.resetHighlights();
        if (self.selectedScenario !== undefined)
          $location.search("scenarioId", self.selectedScenario.id);
        if (self.selectedScenario) {
          self.loadMetrics(self.dataDir + "/" + self.selectedScenario.dataFile);
          if (self.selectedScenario.storiesFile)
            self.loadStories(self.dataDir + "/" + self.selectedScenario.storiesFile);
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
        self.serieses = [];
        for (i in self.selectedMetrics)
          for (j in self.selectedMetrics[i].serieses)
            self.serieses.push(self.selectedMetrics[i].serieses[j])
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
    $scope.$watch("appExplore.selectedScenario", this.selectedScenarioChangedHandler());
    $scope.$watch("appExplore.selectedMetrics", this.selectedMetricsChangedHandler(), true);
    $scope.$watch("appExplore.selectedStory", this.selectedStoryChangedHandler());
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

  .directive("appSchematics", [function() {
    return {
      restrict: "E",
      template: '<ng-include src="appSchematics.getSrcUrl()" data-onload="appSchematics.loaded()" />',
      bindToController: {
        svg: "=",
        serieses: "=",
        highlights: "=",
        dir: "@"
      },
      controllerAs: "appSchematics",
      controller: function($scope, $element) {
        this.getHighlightedSerId = function() {
          return this.highlights.seriesId;
        }
        this.setHighlightedSerId = function(value) {
          this.highlights.seriesId = value;
          if (this.highlights.looseness < 1)
            this.highlights.looseness = 1;
        }
        this.getSerieses = function() {
          return this.serieses;
        }
        this.getSrcUrl = function() {
          return (this.dir ? this.dir + "/" : "")  + this.svg;
        };
        this.loaded = function() {
          svg = $element.find("svg");
          AppHelper.trimSvg(svg);
        }
        this.seriesesValuesChangedHandler = function(values) {
          return function(values) {
            if (values) {
              $scope.$broadcast("seriesesValuesChanged", values);
            }
          }
        }
        // initialize
        $scope.$watch("appSchematics.highlights.seriesesValues", this.seriesesValuesChangedHandler(), true);
      }
    };
  }])

  .directive("appSeries", ["$compile", function($compile) {
    return {
      require: ["^^appSchematics"],
      transclude: true,
      restrict: "A",
      templateUrl: "assets/templates/app-modules/series.html",
      scope: true,
      bindToController: {
        series: "@appSeries"
      },
      controllerAs: "appSeries",
      controller: function($scope, $element) {
        this.hasMetrics = function() {
          serieses = this.schematics.getSerieses();
          for (i in serieses)
            if (serieses[i].id == this.series)
                return true;
          return false;
        }
        this.isHighlighted = function() {
          return (this.series == this.schematics.getHighlightedSerId());
        }
        this.highlightSeries = function() {
          this.schematics.setHighlightedSerId(this.series);
        }
        this.unhighlightSeries = function() {
          this.schematics.setHighlightedSerId(false);
        }
        this.seriesesValuesChangedHandler = function() {
          var self = this;
          return function($event, values) {
            var value = undefined;
            for (i in values)
              if (values[i].id == self.series)
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
        $scope.$on("seriesesValuesChanged", this.seriesesValuesChangedHandler());
      },
      link: function($scope, $element, $attrs, $controllers) {
        $scope.appSeries.schematics = $controllers[0];
        updatedChilds = $element.children().first().find("*")
          .attr("app-style","appSeries.style");
        $compile(updatedChilds)($scope);
      }
    };
  }])

  .directive("appStyle", [function() {
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

  .directive("appTranscope", [function() {
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
  }])

  .directive("appMetric", [function() {
    return {
      require: ["^^appMetrics"],
      restrict: "E",
      templateUrl: "assets/templates/app-modules/metric.html",
      scope: true,
      bindToController: {
        data: "=metric",
        highlights: "="
      },
      controllerAs: "appMetric",
      controller: function($scope, $element) {
        chartOptions = {
          xlabel: 'time',
          xunit: 's',
          ylabel: this.data.label,
          yunit: this.data.unit,
          colorMap: this.data.dataColorMap
        };
        panelOptions = {
          ctrl: this,
          ctrlName: "appMetric",
          chartContainer: $element.children().first()[0],
          dataTransformer: AppHelper.getSeriesDataTransformer("time", "data")
        };
        this.panel = new AppMetricPanel($scope, panelOptions, chartOptions);
      }
    }
  }])

  .directive("appStories", [function() {
    return {
      require: [],
      restrict: "E",
      templateUrl: "assets/templates/app-modules/stories.html",
      scope: true,
      bindToController: {
        stories: "=",
        story: "=",
        highlights: "=",
        homeurl: "@",
        metricsselector: "&"
      },
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
              if (self.story.series)
                self.highlights.seriesId = self.story.series;
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
  }])

  .controller("appExplain", ["$http", function($http) {
    this.resetHighlights = function() {
      if (!this.highlights) this.highlights = {};
      this.highlights.seriesId = undefined;
      this.highlights.time = undefined;
      this.highlights.timeRange = [undefined, undefined];
      this.highlights.looseness = 0;
    };
    this.loadSummary = function(summaryUrl) {
      $http.get(summaryUrl).success(this.summaryLoadedHandler());
    };
    this.summaryLoadedHandler = function() {
      var self = this;
      return function(data) {
        self.summary = data;
        self.resetHighlights();
      };
    };
    // initialization
    this.dataDir = DATA_DIR;
    this.loadSummary(DATA_DIR + "/" + SUMMARY_FILE);
    this.resetHighlights();
  }])

  .directive("appBubble", [function() {
    return {
      restrict: "E",
      templateUrl: "assets/templates/app-modules/bubble.html",
      scope: true,
      controllerAs: "appBubble",
      bindToController: {
        svg: "@",
        color: "@",
        outlinecolor: "@",
        label: "@",
        buttonlink: "@",
        buttontext: "@",
        dir: "@"
      },
      controller: function($scope, $element) {
        this.svgUrl = this.dir + "/" + this.svg;
      }
    }
  }])

  .directive("appChart", [function() {
    return {
      restrict: "E",
      scope: true,
      bindToController: {
        data: "=",
        highlights: "=",
        xlabel: "@",
        ylabel: "@",
        xunit: "@",
        yunit: "@"
      },
      controllerAs: "appChart",
      controller: function($scope, $element) {
        chartOptions = {
          xlabel: this.xlabel,
          xunit: this.xunit,
          yunit: this.yunit,
          ylabel: this.ylabel
        };
        panelOptions = {
          ctrl: this,
          ctrlName: "appChart",
          chartContainer: $element[0],
          dataTransformer: AppHelper.getSeriesDataTransformer("x", "y")
        };
        this.panel = new AppChartPanel($scope, panelOptions, chartOptions);
      }
    }
  }]);
