
AppChart = function(containerNode, options) {
  var self = this;
  this.containerNode = containerNode;
  // read options
  this.options = options || {};
  this.padding = {
    top:    this.options.title  ? 30 : 10,
    right:  20,
    bottom: this.options.xlabel ? 30 : 40,
    left:   this.options.ylabel ? 40 : 20,
  };
  this.setup();
}

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
  this.xAxisNode = this.gridLayer.append("line")
      .attr("class", "x axis");
  this.yAxisNode = this.gridLayer.append("line")
      .attr("class", "y axis")
  this.xTicksNode = this.gridLayer.append("g")
      .attr("class", "x ticks");
  this.yTicksNode = this.gridLayer.append("g")
      .attr("class", "y ticks");
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
  this.highlightXNode = this.highlightLayer.append("g");
  this.draggingX = Math.NaN;
  this.draggingY = Math.NaN;
  this.highlightThis = false;
  this.resizeSensor = new ResizeSensor(this.containerNode, this.scaleHandler());
  this.seriesHighlightedHandlers = [];
  this.seriesUnhighlightedHandlers = [];
  this.dimensionsChangedHandlers = [];
  this.mouseEnterHandlers = [];
  this.mouseLeaveHandlers = [];
  this.mouseMovedHandlers = [];
}

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
  this.scale();
}

AppChart.prototype.getSeriesFromId = function(seriesId) {
  for (i in this.serieses)
    if (this.serieses[i].id == seriesId)
      return this.serieses[i];
}

AppChart.prototype.getXExtent = function(padding) {
  if (padding === undefined) padding = 0.0;
  var minX = undefined, maxX = undefined;
  for (i in this.serieses) {
    extentX = d3.extent(this.serieses[i].values, function(d) { return d.x; });
    if (minX === undefined || extentX[0] < minX) minX = extentX[0];
    if (maxX === undefined || extentX[1] > maxX) maxX = extentX[1];
  }
  return [minX - padding, maxX + padding];
}

AppChart.prototype.getYExtent = function(padding) {
  if (padding === undefined) padding = 0.0;
  var minY = undefined, maxY = undefined;
  for (i in this.serieses) {
    extentY = d3.extent(this.serieses[i].values, function(d) { return d.y; });
    if (minY === undefined || extentY[0] < minY) minY = extentY[0];
    if (maxY === undefined || extentY[1] > maxY) maxY = extentY[1];
  }
  return [minY - padding, maxY + padding];
}

AppChart.prototype.dimensions = function(minX, maxX, minY, maxY) {
  if (minX) this.minX = minX;
  if (maxX) this.maxX = maxX;
  if (minY) this.minY = minY;
  if (maxY) this.maxY = maxY;
  this.x.domain([this.minX, this.maxX]);
  this.y.domain([this.maxY, this.minY]);
  this.scale();
}

AppChart.prototype.highlight = function(changedHighlights) {
  var seriesesDirty = false, highlightsDirty = false;
  if (changedHighlights.seriesId || changedHighlights.seriesId === false) {
    this.highlightedSeries = changedHighlights.seriesId;
    seriesDirty = true;
    highlightsDirty = true;
  }
  if (changedHighlights.colorMap || changedHighlights.colorMap === false) {
    this.colorMap = changedHighlights.colorMap;
    if (this.colorMap === false)
      this.color = d3.interpolateLab("black");
    else
      this.color = d3.scale.linear()
          .domain(this.colorMap.map(function(d) { return d[0]; }))
          .range(this.colorMap.map(function(d) { return d[1]; }));
    seriesDirty = true;
  }
  if (changedHighlights.x || changedHighlights.x === false) {
    this.highlightedX = changedHighlights.x;
    highlightsDirty = true;
  }
  if (changedHighlights.thisGraph !== undefined) {
    this.highlightThis = changedHighlights.thisGraph;
    highlightsDirty = true;
  }
  if (seriesDirty) this.drawSerieses();
  if (highlightsDirty) this.drawHighlights();
  //this.draw();
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
    if (self.xLabelNode)
      self.xLabelNode
          .attr("x", self.size.width/2)
          .attr("y", self.size.height+5);
    if (self.yLabelNode)
      self.yLabelNode
          .attr("transform", "translate("+-30+" "+self.size.height/2+") rotate(-90)");
    if (self.titleNode)
      self.titleNode
          .attr("x", self.size.width/2);
    self.draw();
  };
}

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
  var zeros = function(d) { return d ? "" : "zero"; },
      fx = this.x.tickFormat(10),
      fy = this.y.tickFormat(10);
  // Regenerate x-ticks
  var gx = this.xTicksNode.selectAll("g")
      .data(this.x.ticks(10), String)
      .attr("transform", tx);
  var gxe = gx.enter().insert("g", "a")
      .attr("transform", tx);
  gxe.append("line")
      .attr("class", zeros)
  gxe.append("text")
      .attr("dy", "1em")
      .attr("text-anchor", "middle")
      .text(fx);
  gx.exit().remove();
  // scaling
  gx.selectAll("line")
      .attr("z", 5)
      .attr("y1", this.size.height)
      .attr("y2", this.size.height+5);
  gx.selectAll("text")
      .attr("y", this.size.height+5);
  // Regenerate y-ticks
  var gy = this.yTicksNode.selectAll("g")
      .data(this.y.ticks(10), String)
      .attr("transform", ty);
  gy.select("text").text(fy);
  var gye = gy.enter().insert("g", "a")
      .attr("transform", ty);
  gye.append("line")
      .attr("class", zeros)
  gye.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text(fy);
  gy.exit().remove();
  // scaling
  gy.selectAll("line")
      .attr("x1", -5)
      .attr("x2", 0);
  gy.selectAll("text")
      .attr("x", -5);
}

AppChart.prototype.drawSerieses = function() {
  var self = this;
  this.line = d3.svg.line()
    .interpolate("linear")
    .x(function(d,i) { return this.x(d.x); })
    .y(function(d,i) { return this.y(d.y); });
  if (this.seriesNode) {
    this.seriesNode
        .attr("class", function(d) { return (d.id == self.highlightedSeries ? "highlighted " : "") + "series"; })
        .on("mousemove", self.mouseMovedHandler())
        .selectAll("path")
        .remove();
    this.pathNode = this.seriesNode
        .on("mouseenter", function(d) { self.handleSeriesHighlighted(d.id); })
        .on("mouseleave", function(d) { self.handleSeriesUnhighlighted(d.id); })
        .selectAll("path")
        .data(function(d, i) {
            return AppChart.quad(AppChart.sample(self.line(d.values), 8));
          })
        .enter().append("path");
    this.pathNode
        .style("fill", function(d) { return self.color(self.y.invert(d.p[1])); })
        .style("stroke", function(d) { return self.color(self.y.invert(d.p[1])); })
        .attr("d", function(d) {
            return AppChart.lineJoin(d[0], d[1], d[2], d[3], 2);
          });
  }
  this.graphLayer.call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.zoomHandler()));
}

AppChart.prototype.getValuesForX = function(x) {
  hash = {};
  for (i in this.serieses) {
    series = this.serieses[i]
    p = AppChart.findForX(series.values, x);
    hash[series.id] = {
        id: series.id, x: p.x, y: p.y,
        color: this.color(p.y)
      };
  }
  return hash;
}

AppChart.prototype.drawHighlights = function() {
  var self = this;
  if (this.highlightedX || this.highlightedX === 0.0) {
    this.highlightXNode.attr("class", "show");
    hash = this.getValuesForX(this.highlightedX);
    data = [];
    for (k in hash)
      data.push(hash[k]);
    circles = this.highlightXNode
        .selectAll("circle")
        .data(data, function (d) { return d.id; });
    circles.exit().remove();
    circles.enter().append("circle")
        .attr("r", "5");
    circles
        .attr("class", function (d) { return d.id == self.highlightedSeries ? "highlighted" : ""; })
        .attr("cx", function (d) { return self.x(d.x); })
        .attr("cy", function (d) { return self.y(d.y); })
        .attr("stroke", function (d) { return d.color; })
        .on("mouseenter", function(d) { self.handleSeriesHighlighted(d.id); })
        .on("mouseleave", function(d) { self.handleSeriesUnhighlighted(d.id); });
    if (this.highlightedSeries) {
      var datum = undefined, format = d3.format(".2f");
      for (i in data)
        if (data[i].id == this.highlightedSeries)
          datum = data[i];
      xText = this.highlightXNode.selectAll("text.x").data([datum]);
      yText = this.highlightXNode.selectAll("text.y").data([datum]);
      xText.exit().remove();
      yText.exit().remove();
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
    } else {
      this.highlightXNode.selectAll("text.x").remove();
      this.highlightXNode.selectAll("text.y").remove();
    }
  } else if (this.highlightedX === false) {
    this.highlightXNode.attr("class", "hide");
  }
  this.layers.attr("class", (this.highlightThis ? "highlighted " : "") + "app-chart");
}

AppChart.findForX = function(seriesValues, x) {
  // seriesValues must be an array of points in the form [x, y]
  seriesValues.sort(function(a, b) { return a.x - b.x; });
  var bisect = d3.bisector(function(d) { return d.x; }).left,
      i = bisect(seriesValues, x, 1),
      d0 = seriesValues[i - 1],
      d1 = seriesValues[i],
      d = (d1 === undefined ? d0 : (x-d0.x > d1.x-x ? d1 : d0));
  return d;
}

// see https://bl.ocks.org/mbostock/4163057
AppChart.quad = function(points) {
  return d3.range(points.length - 1).map(function(i) {
    var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
    a.t = (points[i].t + points[i + 1].t) / 2;
    a.p = points[i];
    return a;
  });
}

AppChart.sample = function(d, precision) {
  var path = document.createElementNS(d3.ns.prefix.svg, "path");
  path.setAttribute("d", d);
  var n = path.getTotalLength(), t = [0], i = 0, dt = precision;
  while ((i += dt) < n) t.push(i);
  t.push(n);
  return t.map(function(t) {
    var p = path.getPointAtLength(t), a = [p.x, p.y];
    a.t = t / n;
    return a;
  });
}

AppChart.lineJoin = function(p0, p1, p2, p3, width) {
  var u12 = AppChart.perp(p1, p2),
      r = width / 2,
      a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
      b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
      c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
      d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];
  if (p0) { // clip ad and dc using average of u01 and u12
    var u01 = AppChart.perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
    a = AppChart.lineIntersect(p1, e, a, b);
    d = AppChart.lineIntersect(p1, e, d, c);
  }
  if (p3) { // clip ab and dc using average of u12 and u23
    var u23 = AppChart.perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
    b = AppChart.lineIntersect(p2, e, a, b);
    c = AppChart.lineIntersect(p2, e, d, c);
  }
  return "M" + a + "L" + b + " " + c + " " + d + "Z";
}

AppChart.lineIntersect = function(a, b, c, d) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}

AppChart.perp = function(p0, p1) {
  var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
      u01d = Math.sqrt(u01x * u01x + u01y * u01y);
  return [u01x / u01d, u01y / u01d];
}

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
        y = self.y.invert(p[1]);
    // x axis updated
    if (!isNaN(self.draggingX)) {
      if (x != 0) {
        var changeX = self.draggingX / x;
        maxX = self.minX + (self.x.domain()[1] - self.minX) * changeX;
        self.dimensions(undefined, maxX, undefined, undefined);
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    // y axis updated
    if (!isNaN(self.draggingY)) {
      if (y != 0) {
        var changeY = self.draggingY / y;
        maxY = self.minY + (self.y.domain()[0] - self.minY) * changeY;
        self.dimensions(undefined, undefined, undefined, maxY);
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    if (!isNaN(self.draggingX) || !isNaN(self.draggingY))
      self.handleDimensionsChanged();
  };
}

AppChart.prototype.mouseMovedHandler = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.layers[0][0]),
        x = self.x.invert(p[0]),
        y = self.x.invert(p[1]);
    self.handleMouseMoved(x, y);
    return false;
  };
}

AppChart.prototype.zoomHandler = function() {
  var self = this;
  return function() {
    self.minX = self.x.domain()[0];
    self.maxX = self.x.domain()[1];
    self.maxY = self.y.domain()[0];
    self.minY = self.y.domain()[1];
    self.handleDimensionsChanged();
    self.draw();
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

AppChart.prototype.attachSeriesHighlightedHandler = function(f) {
  this.seriesHighlightedHandlers.push(f);
}

AppChart.prototype.attachSeriesUnhighlightedHandler = function(f) {
  this.seriesUnhighlightedHandlers.push(f);
}

AppChart.prototype.attachDimensionsChangedHandler = function(f) {
  this.dimensionsChangedHandlers.push(f);
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

AppChart.prototype.handleDimensionsChanged = function() {
  for (i in this.dimensionsChangedHandlers) {
    this.dimensionsChangedHandlers[i](
        this.minX, this.maxX, this.minY, this.maxY
      );
    this.draw();
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
