/**
 * Module defining the angularjs dropdown component &lt;app-dropdown&gt; ...
 * &lt;/app-dropdown&gt;
 * @module AppDropdownDirective
 * @exports AppDropdownDirective
 */
define(["underscore", "bootstrap"], function() {

  /**
   * The controller governing the directive's state and it's interaction with
   * the outside world
   * @constructor
   * @param $scope a reference to the angularjs scope of the component
   */
  AppDropdownController = function($scope) {
    this.isPlaceholder = true;
    if (this.type == undefined) this.type = "radio";
    $scope.$watch("appDropdown.selected", this.selectedChangedHandler(), true);
  };

  /**
   * Factory to create the controller; used as the .controller member of the
   * directive
   * @static
   * @param $scope a reference to the angularjs scope of the component
   */
  AppDropdownController.factory = function($scope) {
    return new AppDropdownController($scope);
  };

  /**
   * Select one item from the dropdown menu. If multiple items can be selected
   * toggle the item.
   * @param item the item to select
   */
  AppDropdownController.prototype.select = function(item) {
    if (this.type == "radio") {
      // only one item can be selected
      this.selected = item;
    } else if (this.type == "checkbox") {
      // multiple items can be selected - toggle item on/off
      index = this.selected.indexOf(item);
      if (index > -1)
        this.selected.splice(index, 1);
      else
        this.selected.push(item);
    }
    // invoke external callback ("changed() is injected into the controller")
    this.changed();
  };

  /**
   * Check whether one item is already selected.
   * @param item the item to check
   */
  AppDropdownController.prototype.isSelected = function(item) {
    if (this.type == "radio")
      return item == this.selected;
    else
      return (this.selected.indexOf(item) > -1);
  };

  /**
   * Internal callback to react on change of selection; sets the internal
   * state, the display value of the dropdown, if it needs to display a
   * placeholder etc.
   */
  AppDropdownController.prototype.selectedChangedHandler = function() {
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


  /**
   * The &lt;app-dropdown&gt;...&lt;app-dropdown&gt; directive. Supports the
   * following attributes: <ul>
   *   <li>placeholder '@' - a string to display if no value is selected</li>
   *   <li>list '=' - an array of values where the user can select from</li>
   *   <li>selected '=' - a variable that will be bound to the selected item
   *      </li>
   *   <li>property '@' - if the items where values can be selected from is a
   *      complex object, a property that should be used as a label to display
   *      </li>
   *   <li>type '@' - 'radio' or 'checkbox', depending if multiple values can be
   *      selected</li>
   *   <li>changed '&' - an external callback that is executed when the
   *      selection changes</li>
   * </ul>
   * @constructor
   */
  AppDropdownDirective = function() {
    this.restrict = "E";
    this.templateUrl = "templates/AppDropdown.html";
    this.scope = true;
    this.bindToController = {
      placeholder: "@",
      list: "=",
      selected: "=",
      property: "@",
      type: "@",
      changed: "&"
    };
    this.controllerAs = "appDropdown";
    this.controller = ["$scope", AppDropdownController.factory];
  };

  /**
   * Factory to create the directive; used in the angular.directive call
   * @static
   * @param $scope a reference to the angularjs scope of the component
   */
  AppDropdownDirective.factory = function($scope) {
    return new AppDropdownDirective($scope);
  };

  return AppDropdownDirective;

});
