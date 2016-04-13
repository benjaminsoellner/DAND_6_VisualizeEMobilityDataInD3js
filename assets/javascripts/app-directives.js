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
      template: '<ng-include src="getSrcUrl()" data-onload="loaded()" />',
      scope: {
        svg: "=",
        locations: "=",
        highlightedLocId: "=",
        highlightedMetric: "=",
        dir: "@",
      },

      controller: ['$scope', function($scope) {
        this.getHighlightedLocId = function() {
          return $scope.highlightedLocId;
        }
        this.setHighlightedLocId = function(value) {
          $scope.highlightedLocId = value;
        }
        this.getLocations = function() {
          return $scope.locations;
        }
      }],

      link: function($scope, $elem, $attrib) {
        $scope.getSrcUrl = function() {
          return ($scope.dir ? $scope.dir + "/" : "")  + $scope.svg;
        };
        $scope.loaded = function($event) {
          svg = $elem.find("svg");
          bbox = svg[0].getBBox();
          vbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
          svg[0].setAttribute("viewBox", vbox);
          // svg[0].setAttribute("width", "100%");
          svg[0].removeAttribute("height");
          svg[0].removeAttribute("width");
        };
      }

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
        highlightedLocId: "=",
        highlightedTime: "=",
        // xMax: "=", xMin: "=", xStep: "=", // TODO later... also figure out how to scale x uniformly
        // yMax: "=", yMin: "=", yStep: "="  // TODO
      },

      link: function($scope, $elem, $attrib) {
        $scope.initialize = function($elem) {
          $scope.$watch("highlightedTime", $scope.decorate);
          $scope.$watch("highlightedLocId", $scope.decorate);
          $scope.$watch("isHighlighted", $scope.decorate);
          $scope.drawAndDecorate($elem);
        };
        $scope.drawAndDecorate = function($elem, $event) {
          $scope.draw($event, $elem);
          $scope.decorate($event, $elem);
        };
        $scope.draw = function($event) {
          // TODO draw graph with d3.js
          // TODO set up event listener for
          // - when user hovers over a certain x value -> change highlighedTime
          // - when user hovers over a certain line -> change highlightedLoc
          // - when user hovers into or out of the diagram -> call $scope.setHighlight({"isHighlighted": isHighlighted});
          draw_metrics($scope.metric, $elem.find('svg')[0]);
        };
        $scope.decorate = function($event, $elem) {
          // TODO add classes and/or add/modify elements for
          // - highlightedLoc: highlighted location should be bold
          // - highlightedTime: highlighted time should be indicated by bar
          // - isHighlighted: should be represented by colormap in background

        };
        $scope.initialize($elem);
      }

    };
  }]);
  /*******
   ** /APP METRIC DIRECTIVE
   ******/
