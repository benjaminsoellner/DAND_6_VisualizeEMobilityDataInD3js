
MetricGraph = function(containerNode, options) {
  var self = this;
  this.containerNode = containerNode;
  // read options
  this.options = options || {};
  this.padding = {
    top:    this.options.title  ? 40 : 20,
    right:  20,
    bottom: this.options.xlabel ? 50 : 40,
    left:   this.options.ylabel ? 50 : 20,
  };
  this.setup();
}

MetricGraph.prototype.setup = function() {
  var self = this;
  this.y = d3.scale.linear();
  this.x = d3.scale.linear();
  this.svgNode = d3.select(this.containerNode).append("svg");
  this.gNode = this.svgNode.append("g");
  this.gridNode = this.gNode.append("g")
      .attr("class", "grid");
  this.plotNode = this.gridNode.append("rect")
      .attr("class", "plot")
      .attr("pointer-events", "all")
      .call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.zoomHandler()));
  this.axesNode = this.gridNode.append("g");
  this.xaxisNode = this.gridNode.append("rect")
      .attr("class", "x axis")
      .on("mousedown.drag", self.draggingXStartedHandler())
      .on("touchstart.drag", self.draggingXStartedHandler());
  this.yaxisNode = this.gridNode.append("rect")
      .attr("class", "y axis")
      .on("mousedown.drag", self.draggingYStartedHandler())
      .on("touchstart.drag", self.draggingYStartedHandler());
  // title
  if (this.options.title)
    this.titleNode = this.gridNode.append("text")
        .attr("class", "title")
        .text(this.options.title)
        .attr("dy", "-0.8em")
        .style("text-anchor", "middle");
  // xlabel
  if (this.options.xlabel)
    this.xlabelNode = this.axesNode.append("text")
        .attr("class", "x label")
        .text(this.options.xlabel)
        .attr("dy", "2.4em")
        .style("text-anchor", "middle");
  // ylabel
  if (this.options.ylabel)
    this.ylabelNode = this.axesNode.append("text")
        .attr("class", "y label")
        .text(this.options.ylabel)
        .style("text-anchor", "middle");
  this.draggingX = Math.NaN;
  this.draggingY = Math.NaN;
  // listeners
  d3.select(this.containerNode)
      .on("mousemove.drag", this.mouseMovedHandler())
      .on("touchmove.drag", this.mouseMovedHandler())
      .on("mouseup.drag", this.mouseReleasedHandler())
      .on("touchend.drag", this.mouseReleasedHandler());
  this.resizeSensor = new ResizeSensor(this.containerNode, this.scaleHandler());
  this.seriesHighlightedHandlers = [];
  this.seriesUnhighlightedHandlers = [];
  this.dimensionsChangedHandlers = [];
}

MetricGraph.prototype.bind = function(serieses, highlightedSeries, buildSeriesTransform) {
  var self = this;
  if (buildSeriesTransform)
    serieses = buildSeriesTransform(serieses);
  serieses = serieses.map(function(d) {
    d.highlighted = (d.id == highlightedSeries);
    return d;
  });
  this.serieses = serieses;
  var series = this.gNode.selectAll(".series")
      .data(this.serieses, function(d) { return d.id; });
  var seriese = series.enter();
  seriese.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("id", function(d) { return d.id; })
      .append("path")
        .attr("id", function(d) { return d.id; });
  series.exit().remove();
  this.seriesNode = series;
  this.pathNode = this.seriesNode.selectAll("path");
  this.scale();
}

MetricGraph.prototype.dimensions = function(minX, maxX, minY, maxY) {
  if (minX) this.minX = minX;
  if (maxX) this.maxX = maxX;
  if (minY) this.minY = minY;
  if (maxY) this.maxY = maxY;
  this.x.domain([this.minX, this.maxX]);
  this.y.domain([this.maxY, this.minY]);
  this.scale();
}

MetricGraph.prototype.scale = function() {
  return this.scaleHandler()();
}

MetricGraph.prototype.scaleHandler = function() {
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
    self.gNode
        .attr("width", self.clientWidth)
        .attr("height", self.clientHeight)
        .attr("transform", "translate("+self.padding.left+","+self.padding.top+")");
    self.plotNode
        .attr("width", self.size.width)
        .attr("height", self.size.height);
    self.xaxisNode
        .attr("width", self.size.width)
        .attr("height", self.padding.bottom)
        .attr("transform", "translate(0,"+self.size.height+")");
    self.yaxisNode
        .attr("width", self.padding.left)
        .attr("height", self.size.height)
        .attr("transform", "translate(-"+self.padding.left+",0)");
    if (self.seriesNode)
      self.seriesNode
          .attr("width", self.size.width)
          .attr("height", self.size.height)
          .attr("viewBox", "0 0 " + self.size.width + " " + self.size.height);
    self.x = self.x.range([0, self.size.width]);
    self.y = self.y.range([0, self.size.height]);
    if (self.xlabelNode)
      self.xlabelNode
          .attr("x", self.size.width/2)
          .attr("y", self.size.height);
    if (self.ylabelNode)
      self.ylabelNode
          .attr("transform", "translate("+-30+" "+self.size.height/2+") rotate(-90)");
    if (self.titleNode)
      self.titleNode
          .attr("x", self.size.width/2);
    self.draw();
  };
}

MetricGraph.prototype.draw = function() {
  return this.drawHandler()();
}

MetricGraph.prototype.drawHandler = function() {
  var self = this;
  return function() {
    var tx = function(d) { return "translate(" + self.x(d) + ", 0)"; },
        ty = function(d) { return "translate(0, " + self.y(d) + ")"; };
    var zeros = function(d) { return d ? "" : "zero"; },
        fx = self.x.tickFormat(10),
        fy = self.y.tickFormat(10);
    // Regenerate x-ticks
    var gx = self.axesNode.selectAll("g.x")
        .data(self.x.ticks(10), String)
        .attr("transform", tx);
    var gxe = gx.enter().insert("g", "a")
        .attr("class", "x tick")
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
        .attr("y1", 0)
        .attr("y2", self.size.height);
    gx.selectAll("text")
        .attr("y", self.size.height);
    // Regenerate y-ticks
    var gy = self.axesNode.selectAll("g.y")
        .data(self.y.ticks(10), String)
        .attr("transform", ty);
    gy.select("text").text(fy);
    var gye = gy.enter().insert("g", "a")
        .attr("class", "y tick")
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
        .attr("x1", 0)
        .attr("x2", self.size.width);
    gy.selectAll("text")
        .attr("x", -3);
    // lines
    self.line = d3.svg.line()
      .interpolate("basis")
      .x(function(d,i) { return self.x(d.time); })
      .y(function(d,i) { return self.y(d.value); });
    if (self.seriesNode && self.pathNode) {
      self.seriesNode
          .attr("class", function(d) { return (d.highlighted ? "highlighted " : "") + "series"; })
      self.pathNode
          .attr("d", function(d) { return self.line(d.values); })
          .on("mouseenter", function(d) { self.handleSeriesHighlighted(d.id); })
          .on("mouseleave", function(d) { self.handleSeriesUnhighlighted(d.id); });
    }
    self.plotNode.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.zoomHandler()));
    // lines
  };
}

MetricGraph.prototype.draggingXStartedHandler = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return false; }
    var p = d3.mouse(self.gNode[0][0]);
    self.draggingX = self.x.invert(p[0]);
  };
}

MetricGraph.prototype.draggingYStartedHandler = function() {
  var self = this;
  return function() {
    document.onselectstart = function() { return false; }
    var p = d3.mouse(self.gNode[0][0]);
    self.draggingY = self.y.invert(p[1]);
  };
}

MetricGraph.prototype.mouseMovedHandler = function() {
  var self = this;
  return function() {
    var p = d3.mouse(self.gNode[0][0]),
        t = d3.event.changedTouches;
    // x axis updated
    if (!isNaN(self.draggingX)) {
      var draggedX = self.x.invert(p[0]);
      if (draggedX != 0) {
        var changeX = self.draggingX / draggedX;
        maxX = self.minX + (self.x.domain()[1] - self.minX) * changeX;
        self.dimensions(undefined, maxX, undefined, undefined);
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    // y axis updated
    if (!isNaN(self.draggingY)) {
      var draggedY = self.y.invert(p[1]);
      if (draggedY != 0) {
        var changeY = self.draggingY / draggedY;
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

MetricGraph.prototype.zoomHandler = function() {
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

MetricGraph.prototype.mouseReleasedHandler = function() {
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

MetricGraph.prototype.attachSeriesHighlightedHandler = function(f) {
  this.seriesHighlightedHandlers.push(f);
}

MetricGraph.prototype.attachSeriesUnhighlightedHandler = function(f) {
  this.seriesUnhighlightedHandlers.push(f);
}

MetricGraph.prototype.attachDimensionsChangedHandler = function(f) {
  this.dimensionsChangedHandlers.push(f);
}

MetricGraph.prototype.handleSeriesHighlighted = function(id) {
  for (i in this.seriesHighlightedHandlers) {
    this.seriesHighlightedHandlers[i](id);
  }
}

MetricGraph.prototype.handleSeriesUnhighlighted = function(id) {
  for (i in this.seriesHighlightedHandlers) {
    this.seriesUnhighlightedHandlers[i](id);
  }
}

MetricGraph.prototype.handleDimensionsChanged = function() {
  for (i in this.dimensionsChangedHandlers) {
    this.dimensionsChangedHandlers[i](
        this.minX, this.maxX, this.minY, this.maxY
      );
  }
}
