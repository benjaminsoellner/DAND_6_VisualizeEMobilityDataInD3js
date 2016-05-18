define(["underscore", "bootstrap"], function() {

  AppDropdownController = function($scope) {
    this.isPlaceholder = true;
    if (this.type == undefined) this.type = "radio";
    $scope.$watch("appDropdown.selected", this.selectedChangedHandler(), true);
  };

  AppDropdownController.factory = function($scope) {
    return new AppDropdownController($scope);
  };

  AppDropdownController.prototype.select = function(item) {
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

  AppDropdownController.prototype.isSelected = function(item) {
    if (this.type == "radio")
      return item == this.selected;
    else
      return (this.selected.indexOf(item) > -1);
  };

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

  AppDropdownDirective = function() {
    this.restrict = "E";
    this.templateUrl = "assets/templates/AppDropdown.html";
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
    this.controller = AppDropdownController.factory;
  };

  AppDropdownDirective.factory = function($scope) {
    return new AppDropdownDirective($scope);
  };

  return AppDropdownDirective;

});
