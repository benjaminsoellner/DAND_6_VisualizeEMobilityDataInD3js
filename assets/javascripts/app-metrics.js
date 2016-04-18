
MetricGraph = function(containerNode, options) {
  var self = this;
  this.containerNode = containerNode;
  // read options
  this.options = options || {};
  this.options.xmax = options.xmax || undefined; // TODO calculate x and y extent
  this.options.ymax = options.ymax || undefined;
  this.options.xmin = options.xmin || undefined;
  this.options.ymin = options.ymin || undefined;
  this.padding = {
    top:    this.options.title  ? 40 : 20,
    right:  20,
    bottom: this.options.xlabel ? 50 : 40,
    left:   this.options.ylabel ? 50 : 20,
  };
  this.x = d3.scale.linear()
      .domain([this.options.xmin, this.options.xmax]);
  this.y = d3.scale.linear()
      .domain([this.options.ymax, this.options.ymin])
      .nice();
  // set up canvas
  this.svgNode = d3.select(this.containerNode).append("svg");
  this.gNode = this.svgNode.append("g");
  this.plotNode = this.gNode.append("rect")
      .attr("class", "plot")
      .attr("pointer-events", "all")
      .call(d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.drawHandler()));
  // title
  if (this.options.title)
    this.title = this.gNode.append("text")
        .attr("class", "title")
        .text(this.options.title)
        .attr("dy", "-0.8em")
        .style("text-anchor", "middle");
  // xlabel
  if (this.options.xlabel)
    this.xlabel = this.gNode.append("text")
        .attr("class", "x label")
        .text(this.options.xlabel)
        .attr("dy", "2.4em")
        .style("text-anchor", "middle");
  // ylabel
  if (this.options.ylabel)
    this.ylabel = this.gNode.append("text")
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
  this.resizeSensor = new ResizeSensor(this.containerNode, this.resizeHandler());
  this.locationHighlightedHandlers = [];
  this.locationUnhighlightedHandlers = [];
}

MetricGraph.prototype.bind = function(metricData, highlightedLocation) {
  var self = this;
  this.locations = metricData.locations.map(
    function(location) {
      return {
        id: location.id,
        time: location.time,
        data: location.data,
        highlighted: location.id == highlightedLocation,
        values: location.time.map(function(t, i) {
          return { time: t, value: location.data[i] };
        })
      };
    });
  var loc = this.gNode.selectAll(".location").data(this.locations, function(d) { return d.id; });
  var loce = loc.enter();
  loce.append("svg")
      .attr("top", 0)
      .attr("left", 0)
      .attr("id", function(d) { return d.id; })
      .append("path")
        .attr("id", function(d) { return d.id; });
  loc.exit().remove();
  this.locationNode = loc;
  this.pathNode = this.locationNode.selectAll("path");
}

MetricGraph.prototype.scaleHandler = function() {
  var self = this;
  return function() {
    self.clientWidth = self.containerNode.clientWidth;
    self.clientHeight = self.containerNode.clientHeight -10;
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
    self.locationNode
        .attr("width", self.size.width)
        .attr("height", self.size.height)
        .attr("viewBox", "0 0 " + self.size.width + " " + self.size.height);
    self.x = self.x.range([0, self.size.width]);
    self.y = self.y.range([0, self.size.height]);
    if (self.xlabel)
      self.xlabel
          .attr("x", self.size.width/2)
          .attr("y", self.size.height);
    if (self.ylabel)
      self.ylabel
          .attr("transform", "translate("+-30+" "+self.size.height/2+") rotate(-90)");
    if (self.title)
      self.title
          .attr("x", self.size.width/2);
  };
}

MetricGraph.prototype.resizeHandler = function() {
  var self = this;
  return function() {
    self.scale();
    self.draw();
  }
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
    var gx = self.gNode.selectAll("g.x")
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
        .text(fx)
        .on("mousedown.drag", self.draggingXStartedHandler())
        .on("touchstart.drag", self.draggingXStartedHandler());
    gx.exit().remove();
    // scaling
    gx.selectAll("line")
        .attr("y1", 0)
        .attr("y2", self.size.height);
    gx.selectAll("text")
        .attr("y", self.size.height);
    // Regenerate y-ticks
    var gy = self.gNode.selectAll("g.y")
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
        .text(fy)
        .on("mousedown.drag", self.draggingYStartedHandler())
        .on("touchstart.drag", self.draggingYStartedHandler());
    gy.exit().remove();
    // scaling
    gy.selectAll("line")
        .attr("x1", 0)
        .attr("x2", self.size.width);
    gy.selectAll("text")
        .attr("x", -3);
    // lines
    var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d,i) { return self.x(d.time); })
      .y(function(d,i) { return self.y(d.value); });
    self.locationNode.attr("class", function(d) { return (d.highlighted ? "highlighted " : "") + "location"; })
    self.pathNode
        .attr("d", function(d) { return line(d.values); })
        .on("mouseenter", function(d) { self.handleLocationHighlighted(d.id); })
        .on("mouseleave", function(d) { self.handleLocationUnhighlighted(d.id); });
    self.plotNode.call(d3.behavior.zoom().x(self.x).y(self.y).on("zoom", self.drawHandler()));
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
      var rupx = self.x.invert(p[0]),
          xaxis1 = self.x.domain()[0],
          xaxis2 = self.x.domain()[1],
          xextent = xaxis2 - xaxis1;
      // TODO add logic to change linked x axis here; externalize block to function(xaxis1, xextent, changex)
      if (rupx != 0) {
        var changex, new_domain;
        changex = self.draggingX / rupx;
        new_domain = [xaxis1, xaxis1 + (xextent * changex)];
        self.x.domain(new_domain);
        self.draw();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
    // y axis updated
    if (!isNaN(self.draggingY)) {
      var rupy = self.y.invert(p[1]),
          yaxis1 = self.y.domain()[1],
          yaxis2 = self.y.domain()[0],
          yextent = yaxis2 - yaxis1;
      // TODO add logic to change linked x axis here; externalize block to function(yaxis1, yextent, changey)
      if (rupy != 0) {
        var changey, new_domain;
        changey = self.draggingY / rupy;
        new_domain = [yaxis1 + (yextent * changey), yaxis1];
        self.y.domain(new_domain);
        self.draw();
      }
      d3.event.preventDefault();
      d3.event.stopPropagation();
    }
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

MetricGraph.prototype.scale = function() {
  return this.scaleHandler()();
}

MetricGraph.prototype.draw = function() {
  return this.drawHandler()();
}

MetricGraph.prototype.attachLocationHighlightedHandler = function(f) {
  this.locationHighlightedHandlers.push(f);
}

MetricGraph.prototype.attachLocationUnhighlightedHandler = function(f) {
  this.locationUnhighlightedHandlers.push(f);
}

MetricGraph.prototype.handleLocationHighlighted = function(locationId) {
  for (i in this.locationHighlightedHandlers) {
    this.locationHighlightedHandlers[i](locationId);
  }
}

MetricGraph.prototype.handleLocationUnhighlighted = function(locationId) {
  for (i in this.locationHighlightedHandlers) {
    this.locationUnhighlightedHandlers[i](locationId);
  }
}
