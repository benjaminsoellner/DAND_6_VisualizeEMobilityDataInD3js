var dataDirectory = "data"
var scenariosFile = "scenarios.json"


function showData(error, json) {
  if (error) return console.warn('Error loading scenario JSON: ' + error);
  alert("This should load " + dataFile);
}

function showSchematics(error, svg) {

}

function showStories(error, json) {

}

function selectScenario() {
  dataFile = this.__data__.dataFile;
  storiesFile = this.__data__.storiesFile;
  schematicFile = this.__data__.schematicFile;
  // TODO something xmlrequest... showSchematics(error, svg);
  d3.json(dataDirectory + "/" + dataFile, showData);
  // TODO d3.json(dataDirectory + "/" + storiesFile, showStories);
}

function showScenarios(error, json) {
  if (error) return console.warn('Error loading scenarios JSON: ' + error);
  for (i = 0; i < json.length; i++) {
    json[i] = $.extend(json[i], {'id': i});
  }
  ul = d3.select("ul#ecar-explore-scenarios")
    .selectAll("li")
    .data(json);
  ul.exit().remove();
  li = ul.enter()
    .append("li")
  li.append("input")
    .attr("type", "radio")
    .attr("id", function(d) { return "ecar-explore-scenario-" + d.id; })
    .attr("data-toggle", "scenario");
  li.append("label")
    .attr("for", function(d) { return "ecar-explore-scenario-" + d.id; })
    .text(function(d) { return d.label; } );
  $('ul#ecar-explore-scenarios input[data-toggle="scenario"]')
      .change(selectScenario);
 }

$(document).ready(function() {
  d3.json(dataDirectory + "/" + scenariosFile, showScenarios);
});
