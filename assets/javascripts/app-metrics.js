
function draw_metrics(metricsData, svgObj) {

  var margin = { top: 20, right: 20, bottom: 20, left: 20 },
      width = 600 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
  var x = d3.scale.linear().range([0, width]);
  var y = d3.scale.linear().range([height, 0]);
  var xAxis = d3.svg.axis().scale(x).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left");
  var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) { return x(d.time); })
      .y(function(d) { return y(d.value); });
  var svg = d3.select(svgObj)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate("+margin.left+","+margin.top+")");

  var locations = metricsData.locations.map(function(location) {
    return {
      id: location.id,
      time: location.time,
      data: location.data,
      values: location.time.map(function(t, i) {
        return { time: t, value: location.data[i] };
      })
    };
  })

  x.domain([
    d3.min(locations, function(loc) { return d3.min(loc.values, function(v) { return v.time; })}),
    d3.max(locations, function(loc) { return d3.max(loc.values, function(v) { return v.time; })})
  ]);
  y.domain([
    d3.min(locations, function(loc) { return d3.min(loc.values, function(v) { return v.value; })}),
    d3.max(locations, function(loc) { return d3.max(loc.values, function(v) { return v.value; })})
  ]);
  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis);
  var locationNode = svg.selectAll(".location")
      .data(locations)
    .enter()
      .append("g")
      .attr("class", "location");
  locationNode.append("path")
    .attr("class", "line")
    .attr("d", function(d) { return line(d.values); })
    .attr("id", function(d) { return d.id; })
    .style("stroke", "black");

}
