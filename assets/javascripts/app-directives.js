angular.module("app-directives", [])

  /*******
   ** APP DROPDOWN DIRECTIVE
   ******/
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
  /*******
   ** /APP DROPDOWN DIRECTIVE
   ******/

   /*******
    ** /APP SCHEMATICS DIRECTIVE
    ******/
  .directive("appSchematics", ["$http", "$q", function($http, $q) {
    return {

      restrict: "E",
      template: '<ng-include src="ctrl.getSrcUrl()" data-onload="ctrl.loaded()" />',
      scope: {
        svg: "=",
        locations: "=",
        highlights: "=",
        dir: "@"
      },
      bindToController: true,
      controllerAs: "ctrl",

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
  /*******
   ** /APP SCHEMATICS DIRECTIVE
   ******/
  /*******
   ** APP LOCATION DIRECTIVE
   ******/
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
   /*******
    ** APP LOCATION DIRECTIVE
    ******/
   /*******
    ** APP METRIC DIRECTIVE
    ******/
  .directive("appMetric", [function() {
    return {

      restrict: "E",
      templateUrl: "assets/templates/app-directives/app-metric.html",
      scope: {
        metric: "=",
        isHighlighted: "&",
        setHighlight: "&",
        highlights: "=",
        // xMax: "=", xMin: "=", xStep: "=", // TODO later... also figure out how to scale x uniformly
        // yMax: "=", yMin: "=", yStep: "="  // TODO
      },
      bindToController: true,
      controllerAs: "ctrl",

      controller: function($scope, $element) {
        this.initialize = function() {
          var self = this;
          $scope.$watch("ctrl.highlights.locationId", function() { self.dataUpdated(self) } );
          this.metricGraph = new MetricGraph(
              $element.find('.app-metric-graph')[0],
              {
                xlabel: 'time', ylabel: this.metric.label,
                xmin: 1.0, xmax: 4.0, ymin: 1.0, ymax: 6.0
              }
            );
          this.metricGraph.attachLocationHighlightedHandler(this.locationHighlighted);
          this.metricGraph.attachLocationUnhighlightedHandler(this.locationUnhighlighted);
          this.dataUpdated();
        }
        this.dataUpdated = function(self) {
          if (!self) self = this
          if (self.metricGraph) {
            self.metricGraph.bind(self.metric, self.highlights.locationId);
            self.metricGraph.scale();
            self.metricGraph.draw();
          }
        }
        this.visualUpdated = function() {
          this.metricGraph.scale();
          this.metricGraph.draw();
        }
        this.locationHighlighted = function(locationId) {
          $scope.$apply( function() {
            $scope.ctrl.highlights.locationId = locationId;
          } );
        }
        this.locationUnhighlighted = function(locationId) {
          $scope.$apply( function() {
            $scope.ctrl.highlights.locationId = undefined;
          } );
        }
        this.initialize();
      }


    }
  }]);
  /*******
   ** /APP METRIC DIRECTIVE
   ******/
