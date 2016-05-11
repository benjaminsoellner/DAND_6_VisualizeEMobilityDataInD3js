// Helper Classes

AppGraphStrategy = function(chart) {
  this.chart = chart;
}

AppGraphStrategy.factory = function(chart, graphType) {
  switch (graphType) {
    case "line": return new AppLineGraph(chart);
    case "scatter": return new AppScatterGraph(chart);
  }
}

AppGraphStrategy.drawSeries = function(seriesNode) {
  var self = this;
  seriesNode
      .on("mousemove", this.chart.mouseMovedHandler())
      .on("mouseenter", function(d) { self.chart.handleSeriesHighlighted(d.id); })
      .on("mouseleave", function(d) { self.chart.handleSeriesUnhighlighted(d.id); });
}

AppLineGraph = function(chart) {
  AppGraphStrategy.call(this, chart);
}

AppLineGraph.prototype.getNearest = function(seriesValues, x, y) {
  seriesValues.sort(function(a, b) { return a.x - b.x; });
  var bisect = d3.bisector(function(d) { return d.x; }).left,
      i = bisect(seriesValues, x, 1),
      d0 = seriesValues[i - 1],
      d1 = seriesValues[i],
      d = (d1 === undefined ? d0 : (x-d0.x > d1.x-x ? d1 : d0));
  return d;
}

AppLineGraph.prototype.drawSeries = function(seriesNode) {
  AppGraphStrategy.drawSeries.call(this, seriesNode);
  var self = this;
  seriesNode
      .selectAll("path")
      .remove();
  seriesNode
      .append("path")
      .attr("d", function(d) { return self.chart.line(d.values); })
      .attr("vector-effect", "non-scaling-stroke")
      .style("fill", "transparent")
      .style("stroke", function(d) { return d.color ? d.color : "black"; });
}

AppScatterGraph = function(chart) {
  AppGraphStrategy.call(this, chart);
}

AppScatterGraph.prototype.getNearest = function(values, x, y) {
  // seriesValues must be an array of points in the form [x, y]
  var mindist = undefined, r = undefined,
      xscaled = this.chart.x(x), yscaled = this.chart.y(y)
  for (i in values) {
    value = values[i];
    dist = Math.sqrt(Math.pow(this.chart.x(value.x)-xscaled,2) +
                     Math.pow(this.chart.y(value.y)-yscaled,2));
    if (mindist === undefined || dist < mindist) {
      r = value;
      mindist = dist;
    }
  }
  return r;
}

AppScatterGraph.prototype.drawSeries = function(seriesNode) {
  AppGraphStrategy.drawSeries.call(this, seriesNode);
  var self = this;
  seriesNode.each(function(d) {
      g = d3.select(this);
      circles = g.selectAll("circle").data(d.values);
      opacity = self.chart.options.alpha ? self.chart.options.alpha : 1.0;
      circles.exit().remove();
      circles.enter().append("circle")
          .attr("r", "3")
          .attr("opacity", opacity);
      circles
          .style("fill", function (v) { return d.color ? d.color : "black"; })
          .attr("cx", function (v) { return self.chart.x(v.x); })
          .attr("cy", function (v) { return self.chart.y(v.y); });
    });
}

// App Chart constructor

AppChart = function(containerNode, options) {
  var colorDomain = function(d) { return d[0]; };
  var colorRange = function(d) { return d[1]; };
  var self = this;
  this.containerNode = containerNode;
  // read options
  this.options = options || {};
  this.colorMap = this.options.colorMap;
  if (this.colorMap)
    this.colorMap = d3.scale.linear()
      .domain(this.colorMap.map(colorDomain))
      .range(this.colorMap.map(colorRange));
  this.graphStrategy = AppGraphStrategy.factory(this, options.graphType)
  this.padding = {
    top:    this.options.title  ? 30 : 10,
    right:  20,
    bottom: this.options.xlabel ? 60 : 40,
    left:   this.options.ylabel ? 60 : 40,
  };
  this.setup();
}

// Set-up

AppChart.prototype.setup = function() {
  var self = this;
  this.y = d3.scale.linear();
  this.x = d3.scale.linear();
  this.svgNode = d3.select(this.containerNode).append("svg")
      .on("mouseenter", this.mouseEnterHandler())
      .on("mouseleave", this.mouseLeaveHandler());
  this.layers = this.svgNode.append("g");
  // grid layer
  this.gridLayer = this.layers.append("g")
      .attr("class", "grid layer");
  this.xTicksNode = this.gridLayer.append("g")
      .attr("class", "x ticks");
  this.yGuideNode = this.gridLayer.append("g")
      .attr("class", "y guide");
  this.yTicksNode = this.gridLayer.append("g")
      .attr("class", "y ticks");
  this.xAxisNode = this.gridLayer.append("line")
      .attr("class", "x axis");
  this.yAxisNode = this.gridLayer.append("line")
      .attr("class", "y axis")
  if (this.options.title)
    this.titleNode = this.gridLayer.append("text")
        .attr("class", "title")
        .text(this.options.title)
        .attr("dy", "-0.8em")
        .style("text-anchor", "middle");
  if (this.options.xlabel)
    this.xLabelNode = this.gridLayer.append("text")
        .attr("class", "x label")
        .text(this.options.xlabel
          + (this.options.xunit ? " in " + this.options.xunit : ""))
        .attr("dy", "2.4em")
        .style("text-anchor", "middle");
  if (this.options.ylabel)
    this.yLabelNode = this.gridLayer.append("text")
        .attr("class", "y label")
        .text(this.options.ylabel
          + (this.options.yunit ? " in " + this.options.yunit : ""))
        .style("text-anchor", "middle");
  this.interactXAxis = this.gridLayer.append("rect")
      .attr("class", "interact x axis")
      .on("mousedown.drag", self.draggingXStartedHandler())
      .on("touchstart.drag", self.draggingXStartedHandler());
  this.interactYAxis = this.gridLayer.append("rect")
      .attr("class", "interact y axis")
      .on("mousedown.drag", self.draggingYStartedHandler())
      .on("touchstart.drag", self.draggingYStartedHandler());
  // inner layers
  this.graphLayer = this.layers.append("svg")
      .attr("class", "graph layer")
      .on("mousemove", self.mouseMovedHandler())
      .call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.zoomHandler()));
  this.interactGraph = this.graphLayer.append("rect")
      .attr("class", "interact graph")
  this.seriesesLayer = this.graphLayer.append("g")
      .attr("class", "serieses layer");
  this.highlightLayer = this.graphLayer.append("g")
      .attr("class", "highlight layer");
  // listeners
  d3.select(this.containerNode)
      .on("mousemove.drag", this.mouseDraggedHandler())
      .on("touchmove.drag", this.mouseDraggedHandler())
      .on("mouseup.drag", this.mouseReleasedHandler())
      .on("touchend.drag", this.mouseReleasedHandler());
  // graph layer
  // highlight layer
  this.highlightXYNode = this.highlightLayer.append("g");
  this.draggingX = Math.NaN;
  this.draggingY = Math.NaN;
  this.highlightThis = false;
  this.resizeSensor = new ResizeSensor(this.containerNode, this.resizeHandler());
  this.seriesHighlightedHandlers = [];
  this.seriesUnhighlightedHandlers = [];
  this.zoomedPannedHandlers = [];
  this.mouseEnterHandlers = [];
  this.mouseLeaveHandlers = [];
  this.mouseMovedHandlers = [];
}

// Binding Data

AppChart.prototype.bind = function(serieses, buildSeriesTransform) {
  var self = this;
  if (buildSeriesTransform)
    serieses = buildSeriesTransform(serieses);
  this.serieses = serieses;
  var series = this.seriesesLayer.selectAll(".series")
      .data(this.serieses, function(d) { return d.id; })
      .attr("id", function(d) { return d.id; });
  var seriese = series.enter();
  seriese.append("g")
      .attr("top", 0)
      .attr("left", 0)
      .attr("id", function(d) { return d.id; });
  series.exit().remove();
  this.seriesNode = series;
}

// Helper Functions

AppChart.prototype.getSeriesFromId = function(seriesId) {
  for (i in this.serieses)
    if (this.serieses[i].id == seriesId)
      return this.serieses[i];
}

AppChart.prototype.getXExtent = function(whitespace) {
  if (whitespace === undefined) whitespace = 0.0;
  var minX = undefined, maxX = undefined;
  for (i in this.serieses) {
    extentX = d3.extent(this.serieses[i].values, function(d) { return d.x; });
    if (minX === undefined || extentX[0] < minX) minX = extentX[0];
    if (maxX === undefined || extentX[1] > maxX) maxX = extentX[1];
  }
  if (minX === undefined) minX = 0.0;
  if (maxX === undefined) maxX = 1.0;
  return [minX - whitespace * (maxX-minX), maxX + whitespace * (maxX-minX)];
}

AppChart.prototype.getYExtent = function(whitespace) {
  if (whitespace === undefined) whitespace = 0.0;
  var minY = undefined, maxY = undefined;
  for (i in this.serieses) {
    extentY = d3.extent(this.serieses[i].values, function(d) { return d.y; });
    if (minY === undefined || extentY[0] < minY) minY = extentY[0];
    if (maxY === undefined || extentY[1] > maxY) maxY = extentY[1];
  }
  if (minY === undefined) minY = 0.0;
  if (maxY === undefined) maxY = 1.0;
  return [minY - whitespace * (maxY-minY), maxY + whitespace * (maxY-minY)];
}

AppChart.prototype.getNearest = function(x, y) {
  hash = {};
  for (i in this.serieses) {
    series = this.serieses[i]
    p = this.graphStrategy.getNearest(series.values, x, y);
    hash[series.id] = {
        id: series.id, x: p.x, y: p.y,
        colorVal: this.colorMap ? this.colorMap(p.y) : false,
        color: series.color ? series.color : false
      };
  }
  return hash;
}

AppChart.prototype.subsampleLinPath = function(values, pixelsPerSegment, maxNumSegments, tagObject) {
  segments = [];
  for (i = 0; i < values.length-1; i++) {
    if (i == values.length) break;
    currentVal = values[i];
    nextVal    = values[i+1];
    deltaX   = nextVal.x - currentVal.x;
    deltaY   = nextVal.y - currentVal.y;
    segmentHeight = this.y ? this.y.invert(pixelsPerSegment)-this.y.invert(0) : deltaY;
    segmentCount  = Math.min(Math.max(Math.ceil(Math.abs(deltaY/segmentHeight)), 1), maxNumSegments);
    heightSafe = deltaY/segmentCount;
    widthSafe = deltaX/segmentCount;
    currentSegmentX = currentVal.x;
    currentSegmentY = currentVal.y;
    for (s = 0; s < segmentCount; s++)
      segments.push({
          line: [
            {x: currentVal.x+s*widthSafe,     y: currentVal.y+s*heightSafe},
            {x: currentVal.x+(s+1)*widthSafe, y: currentVal.y+(s+1)*heightSafe}
          ],
          point:
            {x: currentVal.x+(s+0.5)*widthSafe, y: currentVal.y+(s+0.5)*heightSafe},
          tag: tagObject
        });
  }
  return segments;
}

// Handling Re-Scaling Events

AppChart.prototype.dimensions = function(minX, maxX, minY, maxY) {
  var oldMinX = this.minX, oldMaxX = this.maxX,
      oldMinY = this.minX, oldMaxY = this.maxY;
  if ((oldMinX !== minX && minX !== undefined) ||
      (oldMaxX !== maxX && maxX !== undefined) ||
      (oldMinY !== minY && minY !== undefined) ||
      (oldMaxY !== maxY && maxY !== undefined)) {
    if (minX !== undefined) this.minX = minX;
    if (maxX !== undefined) this.maxX = maxX;
    if (minY !== undefined) this.minY = minY;
    if (maxY !== undefined) this.maxY = maxY;
    this.x.domain([this.minX, this.maxX]);
    this.y.domain([this.maxY, this.minY]);
    this.scale();
    this.draw();
  }
}

AppChart.prototype.scale = function() {
  return this.scaleHandler()();
}

AppChart.prototype.scaleHandler = function() {
  var self = this;
  return function() {
    self.clientWidth = self.containerNode.clientWidth;
    self.clientHeight = self.containerNode.clientHeight -1;
    self.size = {
      width:  self.clientWidth - self.padding.left - self.padding.right,
      height: self.clientHeight - self.padding.top - self.padding.bottom
    };
    self.svgNode
        .attr("width",  self.clientWidth)
        .attr("height", self.clientHeight);
    self.layers
        .attr("width", self.clientWidth)
        .attr("height", self.clientHeight)
        .attr("transform", "translate("+self.padding.left+","+self.padding.top+")");
    self.interactGraph
        .attr("transform", "translate("+self.padding.left+","+self.padding.top+")")
        .attr("width", self.size.width)
        .attr("height", self.size.height);
    self.interactXAxis
        .attr("width", self.size.width)
        .attr("height", self.padding.bottom)
        .attr("transform", "translate(0,"+self.size.height+")");
    self.interactYAxis
        .attr("width", self.padding.left)
        .attr("height", self.size.height)
        .attr("transform", "translate(-"+self.padding.left+",0)");
    self.graphLayer
        .attr("width", self.size.width)
        .attr("height", self.size.height)
        .attr("viewBox", "0 0 " + self.size.width + " " + self.size.height);
    self.x = self.x.range([0, self.size.width]);
    self.y = self.y.range([0, self.size.height]);
    self.xAxisNode
        .attr("x1", 0)
        .attr("x2", self.size.width)
        .attr("transform", "translate(0,"+self.size.height+")");
    self.yAxisNode
        .attr("y1", 0)
        .attr("y2", self.size.height);
    self.yGuideNode
        .attr("x", self.padding.left-10)
        .attr("width", 10)
        .attr(self.size.height);
    if (self.xLabelNode)
      self.xLabelNode
          .attr("x", self.size.width/2)
          .attr("y", self.size.height+5);
    if (self.yLabelNode)
      self.yLabelNode
          .attr("transform", "translate("+-40+" "+self.size.height/2+") rotate(-90)");
    if (self.titleNode)
      self.titleNode
          .attr("x", self.size.width/2);
  };
}

AppChart.prototype.resizeHandler = function() {
  var self = this;
  return function() {
    self.scaleHandler()();
    self.draw();
  }
}

// Handling Highlight-Events (mouseovers, marks etc.)

AppChart.prototype.highlight = function(changedHighlights) {
  var highlightsDirty = false;
  if (changedHighlights.seriesId || changedHighlights.seriesId === false) {
    this.highlightedSeries = changedHighlights.seriesId;
    highlightsDirty = true;
  }
  if (changedHighlights.x || changedHighlights.x === false) {
    this.highlightedX = changedHighlights.x;
    highlightsDirty = true;
  }
  if (changedHighlights.y || changedHighlights.y === false) {
    this.highlightedY = changedHighlights.y;
    highlightsDirty = true;
  }
  if (changedHighlights.thisChart !== undefined) {
    this.highlightThis = changedHighlights.thisChart;
    highlightsDirty = true;
  }
  if (highlightsDirty) this.drawHighlights();
}

// Drawing the components

AppChart.prototype.draw = function() {
  return this.drawHandler()();
}

AppChart.prototype.drawHandler = function() {
  var self = this;
  return function() {
    self.drawGrid();
    self.drawSerieses();
    self.drawHighlights();
  };
}

AppChart.prototype.drawGrid = function() {
  var self = this;
  var tx = function(d) { return "translate(" + self.x(d) + ", 0)"; },
      ty = function(d) { return "translate(0, " + self.y(d) + ")"; };
  var lg = function(d) { return "long " + (d ? "" : "zero"); },
      fx = this.x.tickFormat(10),
      fy = this.y.tickFormat(10);
  // Regenerate x-ticks
  var gx = this.xTicksNode.selectAll("g")
      .data(this.x.ticks(10), String)
      .attr("transform", tx);
  var gxe = gx.enter().insert("g", "a")
      .attr("transform", tx);
  gxe.append("line").attr("class", "short");
  gxe.append("line").attr("class", lg);
  gxe.append("text")
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text(fx);
  gx.exit().remove();
  // scaling
  gx.selectAll("text")
      .attr("y", this.size.height+5);
  gx.selectAll("line.long")
      .attr("y1", 0)
      .attr("y2", this.size.height);
  gx.selectAll("line.short")
      .attr("y1", this.size.height)
      .attr("y2", this.size.height+5);
  // Regenerate y-ticks
  var gy = this.yTicksNode.selectAll("g")
      .data(this.y.ticks(10), String)
      .attr("transform", ty);
  gy.select("text").text(fy);
  var gye = gy.enter().insert("g", "a")
      .attr("transform", ty);
  gye.append("line").attr("class", "short");
  gye.append("line").attr("class", lg);
  // scaling
  gy.selectAll("line.short")
      .attr("x1", -5)
      .attr("x2", 0);
  gy.selectAll("line.long")
      .attr("x1", 0)
      .attr("x2", this.size.width);
  gye.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(fy);
  gy.exit().remove();
  // scaling
  gy.selectAll("line")
  gy.selectAll("text")
      .attr("x", -5);
  // Regenerate y-guide
  if (this.colorMap) {
    var numGuides = self.size.height / 5,
        guideTicks = this.y.ticks(numGuides);
    guideRects = []
    for (i in guideTicks)
      guideRects.push([i == 0 ? guideTicks[i] : guideTicks[i-1], guideTicks[i]]);
    guideRects.push([guideTicks[guideTicks.length-1], this.y.invert(0)]);
    gg = this.yGuideNode.selectAll("rect")
        .data(guideRects)
    gg.exit().remove();
    gge = gg.enter().append("rect");
    gg.attr("transform", function(d) { return "translate(-5, " + (self.y(d[1])) + ")"; })
      .attr("height", function(d) { return self.y(d[0])-self.y(d[1])+1; })
      .attr("fill", function(d) { return self.colorMap(d[1]); })
      .attr("width", "5");
  };
}

AppChart.prototype.drawSerieses = function() {
  var self = this;
  this.line = d3.svg.line()
    .interpolate("linear")
    .x(function(d,i) { return this.x(d.x); })
    .y(function(d,i) { return this.y(d.y); });
  if (this.seriesNode)
    this.graphStrategy.drawSeries(this.seriesNode)
  this.graphLayer.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.zoomHandler()));
}

AppChart.prototype.drawHighlights = function() {
  var self = this;
  if (this.highlightedX !== undefined || this.highlightedY !== undefined) {
    this.highlightXYNode.attr("class", "show");
    hash = this.getNearest(this.highlightedX, this.highlightedY);
    data = [];
    for (k in hash)
      data.push(hash[k]);
    circles = this.highlightXYNode
        .selectAll("circle")
        .data(data, function (d) { return d.id; });
    circles.enter().append("circle")
        .attr("r", "5");
    circles
        .attr("class", function (d) {
            return (d.id == self.highlightedSeries ? "highlighted" : "") + " " +
                   (d.colorVal ? "with-color-map" : "");
          })
        .attr("cx", function (d) {
            return self.x(d.x);
          })
        .attr("cy", function (d) {
            return self.y(d.y);
          })
        .attr("stroke", function (d) { return d.color ? d.color : d.colorVal ? d.colorVal : "black"; })
        .attr("fill", function (d) { return d.colorVal ? d.colorVal : "transparent"; })
        .on("mouseenter", function(d) { self.handleSeriesHighlighted(d.id); })
        .on("mouseleave", function(d) { self.handleSeriesUnhighlighted(d.id); });
    if (data.length > 0 && this.highlightedSeries) {
      var datum = undefined, format = d3.format(".2f");
      for (i in data)
        if (data[i].id == this.highlightedSeries)
          datum = data[i];
      xText = this.highlightXYNode.selectAll("text.x").data([datum]);
      yText = this.highlightXYNode.selectAll("text.y").data([datum]);
      xText.exit().remove();
      yText.exit().remove();
      if (datum) {
        xText.enter().append("text").attr("class", "x");
        yText.enter().append("text").attr("class", "y");
        xText.text(function(d) {
                return format(d.x) + (self.options.xunit ? self.options.xunit : "");
              })
            .attr("x", function(d) { return self.x(d.x); })
            .attr("y", function(d) { return self.y(d.y)+20; })
            .attr("text-anchor", "middle");
        yText.text(function(d) {
                return format(d.y) + (self.options.yunit ? self.options.yunit : "");
              })
            .attr("x", function(d) { return self.x(d.x)-10; })
            .attr("y", function(d) { return self.y(d.y)+3; })
            .attr("text-anchor", "end");
      }
    } else {
      this.highlightXYNode.selectAll("text.x").remove();
      this.highlightXYNode.selectAll("text.y").remove();
    }
  } else if (this.highlightedX === false) {
    this.highlightXYNode.attr("class", "hide");
  }
  this.layers.attr("class", (this.highlightThis ? "highlighted" : "unhighlighted") + " app-chart");
  if (this.seriesNode)
    this.seriesNode.attr("class", function(d) { return (d.id == self.highlightedSeries ? "highlighted " : "unhighlighted") + " series"; })
}

// Functions consuming events (potentially regenerating for external listeners)

AppChart.prototype.draggingXStartedHandler = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return false; }
    var p = d3.mouse(self.layers[0][0]);
    self.draggingX = self.x.invert(p[0]);
  };
}

AppChart.prototype.draggingYStartedHandler = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return false; }
    var p = d3.mouse(self.layers[0][0]);
    self.draggingY = self.y.invert(p[1]);
  };
}

AppChart.prototype.mouseDraggedHandler = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.layers[0][0]),
        t = d3.event.changedTouches,
        x = self.x.invert(p[0]),
        y = self.y.invert(p[1]),
        newMaxX = undefined, newMaxY = undefined;
    // x axis updated
    if (self.draggingX !== undefined) {
      if (x != 0) {
        var changeX = self.draggingX / x;
        newMaxX = self.minX + (self.x.domain()[1] - self.minX) * changeX;
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    // y axis updated
    if (self.draggingY !== undefined) {
      if (y != 0) {
        var changeY = self.draggingY / y;
        newMaxY = self.minY + (self.y.domain()[0] - self.minY) * changeY;
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    if (newMaxX !== undefined || newMaxY !== undefined) {
      self.dimensions(undefined, newMaxX, undefined, newMaxY);
      self.handleZoomedPanned();
    }
  };
}

AppChart.prototype.mouseMovedHandler = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.layers[0][0]),
        x = self.x.invert(p[0]),
        y = self.y.invert(p[1]);
    self.handleMouseMoved(x, y);
    return false;
  };
}

AppChart.prototype.zoomHandler = function() {
  var self = this;
  return function() {
    minX = self.x.domain()[0];
    maxX = self.x.domain()[1];
    maxY = self.y.domain()[0];
    minY = self.y.domain()[1];
    self.dimensions(minX, maxX, minY, maxY);
    self.handleZoomedPanned();
  };
}

AppChart.prototype.mouseReleasedHandler = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return true; }
    if (!isNaN(self.draggingX)) {
      self.draw();
      self.draggingX = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    if (!isNaN(self.draggingY)) {
      self.draw();
      self.draggingY = Math.NaN;
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
  };
}

AppChart.prototype.mouseEnterHandler = function(f) {
  var self = this;
  return function() {
    self.handleMouseEnter();
  }
}

AppChart.prototype.mouseLeaveHandler = function(f) {
  var self = this;
  return function() {
    self.handleMouseLeave();
  }
}

// Functions for Attaching External Event Handlers

AppChart.prototype.attachSeriesHighlightedHandler = function(f) {
  this.seriesHighlightedHandlers.push(f);
}

AppChart.prototype.attachSeriesUnhighlightedHandler = function(f) {
  this.seriesUnhighlightedHandlers.push(f);
}

AppChart.prototype.attachZoomedPannedHandler = function(f) {
  this.zoomedPannedHandlers.push(f);
}

AppChart.prototype.attachMouseEnterHandler = function(f) {
  this.mouseEnterHandlers.push(f);
}

AppChart.prototype.attachMouseLeaveHandler = function(f) {
  this.mouseLeaveHandlers.push(f);
}

AppChart.prototype.attachMouseMovedHandler = function(f) {
  this.mouseMovedHandlers.push(f);
}

// Functions for Invoking External Event Handlers

AppChart.prototype.handleSeriesHighlighted = function(id) {
  for (i in this.seriesHighlightedHandlers) {
    this.seriesHighlightedHandlers[i](id);
  }
}

AppChart.prototype.handleSeriesUnhighlighted = function(id) {
  for (i in this.seriesHighlightedHandlers) {
    this.seriesUnhighlightedHandlers[i](id);
  }
}

AppChart.prototype.handleZoomedPanned = function() {
  for (i in this.zoomedPannedHandlers) {
    this.zoomedPannedHandlers[i](
        this.minX, this.maxX, this.minY, this.maxY
      );
  }
}

AppChart.prototype.handleMouseEnter = function() {
  for (i in this.mouseEnterHandlers) {
    this.mouseEnterHandlers[i]();
  }
}

AppChart.prototype.handleMouseLeave = function() {
  for (i in this.mouseLeaveHandlers) {
    this.mouseLeaveHandlers[i]();
  }
}

AppChart.prototype.handleMouseMoved = function(x, y) {
  for (i in this.mouseMovedHandlers) {
    this.mouseMovedHandlers[i](x, y);
  }
}
