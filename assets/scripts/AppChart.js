/**
 * A module to represent a chart drawn by d3.js into a DOM container which can
 * have some data bound to it and some interactivity applied to it.
 * @module AppChart
 * @exports AppChart
 */
define(["d3", "resizeSensor"], function() {

  /**
   * An abstract class to hold the specific algorighms to draw a chart.
   * These are different for point charts, line charts etc.
   * Supply the basic chart object as parameter.
   * @constructor
   * @abstract
   * @param chart the basic chart object this strategy belongs to
   */
  AppGraphStrategy = function(chart) {
    this.chart = chart;
  };

  /**
   * Creates a new instance of a chart factory, the parameter graphType
   * specifies which subtype to create
   * @static
   * @param chart the basic chart object this graph strategy belongs to
   * @param graphType the type of graph; supported is: "line" or "scatter"
   */
  AppGraphStrategy.factory = function(chart, graphType) {
    switch (graphType) {
      case "line": return new AppLineGraph(chart);
      case "scatter": return new AppScatterGraph(chart);
    }
  };

  /**
   * from a series of values in the chart, gets the point which is closest
   * to some coordinate "x". how to access the coordinate in the series of
   * values supplied to the function is specified by an additional accessor
   * function that is applied to each value of the series.
   * @param seriesValues an array of values representing the series to analyze
   * @param x the value to find the closest point to
   * @param accessor the accessor function to apply to each seriesValue to get
   *   the equivalent of "x"
   */
  AppGraphStrategy.prototype.getNearest = function(seriesValues, x, accessor) {
    // closest value is found by bisection into values larger and smaller
    // than "x", then we take the "middle" of the bisection
    seriesValues.sort(function(a, b) { return accessor(a) - accessor(b); });
    var bisect = d3.bisector(function(d) { return accessor(d); }).left,
        i = bisect(seriesValues, x, 1),
        d0 = seriesValues[i - 1], // middle (left if odd number of elements)
        d1 = seriesValues[i], // middle (right if odd nummer of elements)
        d = (d1 === undefined ? d0 :  // edge case: only 1 element
          (x-accessor(d0) > accessor(d1)-x ? d1 : d0));
    return d;
  };

  /**
   * method for drawing a number of markers to the chart. A marker is a
   * highlight of a datapoint on the graph canvas with a label of coordinates.
   * The method delegates back to the base charts drawMarkers(...) function.
   * @param seriesesNode the DOM node where all the data serieses are attached
   *   with their respective "marker" property via d3's data(...) function.
   * @param accessor accessor function to apply to the marker values in order
   *   to extract coordinate values to search for close datapoints with
   *   AppGraphStrategy.prototype.getNearest(...).
   */
  AppGraphStrategy.prototype.drawMarkers = function(seriesesNode, accessor) {
    var self = this;
    // iterate through all serieses
    seriesesNode.each(function(d) {
        // if series has markers
        if (d.markers) {
          // memorize the series's specific DOM node (should be a g-element)
          g = d3.select(this);
          // get the closest data points for each marker
          values = d.markers.map(function(marker) {
              value = self.getNearest(d.values, accessor(marker));
              // but also carry over the "coords" attribute if it is set
              value.coords = marker.coords;
              return value;
            });
          // delegate back to AppGraph.prototype.drawMarkers(...)
          self.chart.drawMarkers(values, g);
        }
      });
  };

  /**
   * Draws the annotation saved with each data series
   * The method delegates back to the base charts drawAnnotation(...) function.
   * @param seriesesNode the DOM node where all the data serieses are attached
   *   with their respective "annotation" property via d3's data(...) function.
   */
  AppGraphStrategy.prototype.drawAnnotations = function(seriesesNode) {
    var self = this;
    // iterate through all serieses
    seriesesNode.each(function(d) {
        // if the series has annotations defined
        if (d.annotations) {
          // memorize the series's specific DOM node (should be a g-element)
          g = d3.select(this);
          // delegate back to AppGraph.prototype.drawAnnotations(...)
          self.chart.drawAnnotations(d.annotations, g);
        }
      });
  };

  /**
   *
   * Draws all the serieses data points. Should be overriden by specific
   * AppGraphStrategy subclass but should be called from subclass, because
   * sets up some event listeners
   * @abstract
   * @param seriesNode the DOM node where all the data serieses are attached
   *   with their respective datapoints in the "values" property.
   */
  AppGraphStrategy.prototype.drawSerieses = function(seriesNode) {
    var self = this;
    // set up handler to highlight serieses on hover and change focussed X/Y
    // coordinate on mouse move
    seriesNode
        .on("mousemove", this.chart.mouseMovedHandler())
        .on("mouseenter",
            function(d) { self.chart.handleSeriesHighlighted(d.id); })
        .on("mouseleave",
            function(d) { self.chart.handleSeriesUnhighlighted(d.id); });
  };

  /**
   * A strategy to draw line graph (time series)
   * @constructor
   * @extends module:AppChart~AppGraphStrategy
   * @param chart the basic chart object this strategy belongs to
   */
  AppLineGraph = function(chart) {
    AppGraphStrategy.call(this, chart);
  };
  AppLineGraph.prototype = Object.create(AppGraphStrategy.prototype);

  /**
   * For a set of values, gets the closest value based on the x coordinate
   * @param seriesValues the values to choose the closest value from
   * @param x the x coordinate
   * @param y the y coordinate (ignored in this implementation)
   */
  AppLineGraph.prototype.getNearest = function(seriesValues, x, y) {
    return AppGraphStrategy.prototype.getNearest
              .call(this, seriesValues, x, function (d) { return d.x; });
  };

  /**
   * @see module:AppChart~AppGraphStrategy#drawMarkers
   */
  AppLineGraph.prototype.drawMarkers = function(seriesesNode) {
    // delegate to super; definitive for closeness of a data point in the
    // line graph is the x-coordinate
    AppGraphStrategy.prototype.drawMarkers.call(this, seriesesNode,
        function (d) { return d.x; }
      );
  };

  /**
   * Draws a time series (line graph) based on the seriesesNodes attached
   * values. Also draws markers and annotations.
   * @param seriesesNode the DOM node where all the data serieses are attached
   *   with their respective datapoints in the "values" property.
   */
  AppLineGraph.prototype.drawSerieses = function(seriesesNode) {
    AppGraphStrategy.prototype.drawSerieses.call(this, seriesesNode);
    var self = this;
    // remove all old lines
    seriesesNode
        .selectAll("path")
        .remove();
    // append new lines (need to do this every time since line's range may
    // have changed because of zooming & panning)
    seriesesNode
        .append("path")
        .attr("d", function(d) { return self.chart.line(d.values); })
        .attr("vector-effect",
                "non-scaling-stroke") // line not dependent on zoom level
        .style("fill", "transparent")
        .style("stroke", function(d) { return d.color ? d.color : "black"; });
    // oh and also draw markers and annotations for this series
    this.drawMarkers(seriesesNode);
    this.drawAnnotations(seriesesNode);
  };

  /**
   * A strategy to draw scatter plots
   * @constructor
   * @extends module:AppChart~AppGraphStrategy
   * @param chart the basic chart object this strategy belongs to
   */
  AppScatterGraph = function(chart) {
    AppGraphStrategy.call(this, chart);
  };
  AppScatterGraph.prototype = Object.create(AppGraphStrategy.prototype);

  /**
   * For a set of values, gets the closest value based on either the "t" value
   * (time value) if one value is supplied or the x and y coordinate if two
   * values are supplied
   * @param seriesValues the values to choose the closest value from
   * @param x_or_t the x or t coordinate
   * @param y the y coordinate
   */
  AppScatterGraph.prototype.getNearest = function(values, x_or_t, y) {
    if (y === undefined) {
      // in case only one value is supplied just redirect to the superclass
      // function with the appropriate accessor (this is used if markers are
      // shown, e.g., based on fixed markers supplied as the series.markers
      // data)
      var t = x_or_t;
      return AppGraphStrategy.prototype.getNearest.call(this, values, t,
        function (d) { return d.t; } );
    } else {
      // otherwise we must apply the eucledian distance to all the values
      var x = x_or_t, mindist = undefined, r = undefined,
          xscaled = this.chart.x(x), yscaled = this.chart.y(y);
      // iterate through all the values; there are better solutions than that
      // for large data sets (with binary trees etc.) but not today...
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
  };

  /**
   * @see module:AppChart~AppGraphStrategy#drawMarkers
   */
  AppScatterGraph.prototype.drawMarkers = function(seriesesNode) {
    AppGraphStrategy.prototype.drawMarkers.call(this, seriesesNode,
        function (d) { return d.t; }
      );
  };

  /**
   * Draws a scatter plot based on the seriesesNodes attached
   * values. Also draws markers and annotations.
   * @param seriesesNode the DOM node where all the data serieses are attached
   *   with their respective datapoints in the "values" property.
   */
  AppScatterGraph.prototype.drawSerieses = function(seriesesNode) {
    AppGraphStrategy.prototype.drawSerieses.call(this, seriesesNode);
    var self = this;
    // iterate through all the serieses
    seriesesNode.each(function(d) {
        // memorize the series's element (should be <g> but whatever)
        g = d3.select(this);
        // attach all the values to circles with class point in the element
        circles = g.selectAll("circle.point").data(d.values);
        // set an alpha level if one was specified in the chart's options
        opacity = self.chart.options.alpha ? self.chart.options.alpha : 1.0;
        // remove old circles, add new circles with class, opacity and radius
        circles.exit().remove();
        circles.enter().append("circle")
            .attr("r", "3")
            .attr("opacity", opacity)
            .attr("class", "point");
        // re-position all the circles (need to do this since x/y range may
        // have changed because of zooming)
        circles
            .style("fill", function (v) { return d.color ? d.color : "black"; })
            .attr("cx", function (v) { return self.chart.x(v.x); })
            .attr("cy", function (v) { return self.chart.y(v.y); });
      });
    // oh and also draw markers and annotations
    this.drawMarkers(seriesesNode);
    this.drawAnnotations(seriesesNode);
  };

  //==== AppChart

  //---- Initialization & Data Binding

  /**
   * A chart drawn using d3.js with axis, zooming & panning functionality,
   * display of different data serieses, highlight support etc.
   * @constructor
   * @param containerNode the DOM node to contain the chart
   * @param options a object of options - possible values include: <ul>
   *   <li>colorMap - an array of pairs mapping a value to a color</li>
   *   <li>metricId - the metricId the values stem from</li>
   *   <li>xlabel - the caption of the x axis</li>
   *   <li>ylabel - the caption of the y axis</li>
   *   <li>title - the text of the graph title</li>
   *   <li>graphType - one of "line" or "scatter"</li>
   *   </ul>
   */
  AppChart = function(containerNode, options) {
    var colorDomain = function(d) { return d[0]; };
    var colorRange = function(d) { return d[1]; };
    var self = this;
    // store container node
    this.containerNode = containerNode;
    // read options
    this.options = options || {};
    // set up color map
    this.colorMap = this.options.colorMap;
    if (this.colorMap)
      this.colorMap = d3.scale.linear()
        .domain(this.colorMap.map(colorDomain))
        .range(this.colorMap.map(colorRange));
    // set up metric id, graph strategy and padding based on x/y label + title
    this.metricId = this.options.metricId;
    this.graphStrategy = AppGraphStrategy.factory(this, options.graphType);
    this.padding = {
      top:    this.options.title  ? 30 : 10,
      right:  20,
      bottom: this.options.xlabel ? 60 : 40,
      left:   this.options.ylabel ? 60 : 40
    };
    // setup() will perform layout of the DOM nodes
    this.setup();
  };

  /**
   * Sets up the DOM nodes of the chart. Should not be called from outside,
   * will be called by the constructor once on creation of the chart.
   * All DOM nodes will be available using AppChart....Layer or
   * AppChart....Node after calling this method.
   */
  AppChart.prototype.setup = function() {
    var self = this;
    // set up scales (linear in x- and y-direction)
    this.y = d3.scale.linear();
    this.x = d3.scale.linear();
    // first level: SVG top level element
    this.svgNode = d3.select(this.containerNode).append("svg")
        .on("mouseenter", this.mouseEnterHandler())
        .on("mouseleave", this.mouseLeaveHandler());
    // second level: <g> element grouping all the layers
    this.layers = this.svgNode.append("g");
    // third level: different layers
    // third level, first layer: the grid, containing:
    //    ticks, labels, title and a transparent rect used to catch mouse
    //    events for re-scaling of the axis
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
        .attr("class", "y axis");
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
    // third level, second layer: the "graph", containing several sublayers
    this.graphLayer = this.layers.append("svg")
        .attr("class", "graph layer " + this.options.graphType)
        .on("mousemove", self.mouseMovedHandler())  // handle mouse motion
        .call(d3.behavior.zoom().x(this.x).y(this.y)
                  .on("zoom", this.zoomHandler())); // add zoomable behaviour
    // sublayer 1: graph layer is used for catching mouse events
    this.interactGraph = this.graphLayer.append("rect")
        .attr("class", "interact graph");
    // sublayer 2: "hotspots" (little flashy rects to tell stories in
    //    explorative views)
    this.hotspotLayer = this.graphLayer.append("g")
        .attr("class", "hotspot layer");
    // sublayer 3: layer to display the actual data
    this.seriesesLayer = this.graphLayer.append("g")
        .attr("class", "serieses layer");
    // sublayer 4: markers of single data points
    this.markerLayer = this.graphLayer.append("g")
        .attr("class", "marker layer");
    // sublayer 5: annotations (text overlays), also used for explorative view
    this.annotationLayer = this.graphLayer.append("g")
        .attr("class", "annotation layer");
    // sublayer 6: shows elements that highlight areas interactively
    this.highlightLayer = this.graphLayer.append("g")
        .attr("class", "highlight layer");
    this.highlightXYNode = this.highlightLayer.append("g");
    // the whole container node should responde to drag events (zooming)
    d3.select(this.containerNode)
        .on("mousemove.drag", this.mouseDraggedHandler())
        .on("touchmove.drag", this.mouseDraggedHandler())
        .on("mouseup.drag", this.mouseReleasedHandler())
        .on("touchend.drag", this.mouseReleasedHandler());
    // currently we are not dragging anywhere
    this.draggingX = Math.NaN;
    this.draggingY = Math.NaN;
    // we also presume that we have not highlighted this graph
    this.highlightThis = false;
    // react to resize events of the surrounding container node
    this.resizeSensor = new ResizeSensor(this.containerNode,
                          this.resizeHandler());
    // setup any outside handlers
    this.seriesHighlightedHandlers = [];
    this.seriesUnhighlightedHandlers = [];
    this.zoomedPannedHandlers = [];
    this.mouseEnterHandlers = [];
    this.mouseLeaveHandlers = [];
    this.mouseMovedHandlers = [];
  };

  /**
   * Binds data to the graph. Call this function from outside with a "serieses"
   * dataset and, if you like, supply a buildSeriesTransform callback which
   * will be applied to the serieses dataset before it is bound to the
   * chart.
   * @param serieses the dataset to bind / show in the graph; this is an
   *   array of series objects with the following values: <ul>
   *   <li>values: an array of points in the form
   *      &#123;x:...,y:...[,t:...]&#125;</li>
   *   <li>id: an id of the series</li>
   *   <li>markers: an array of markers in the form &#123;x/y/t:...,coords:...
   *      &#125;</li>
   *   <li>annotations: an array of annotations to display</li>
   *   </ul>
   *   See the serieses documentation for more detail.
   * @param buildSeriesTransform the callback function to apply to every
   *   series before it is bound to the chart
   */
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
    this.seriesesNode = series;
  };

  //---- Helper functions

  /**
   * Returns a series with a series ID from the "belly" of the already bound
   * chart data
   * @param seriesId the series to recall
   */
  AppChart.prototype.getSeriesFromId = function(seriesId) {
    for (i in this.serieses)
      if (this.serieses[i].id == seriesId)
        return this.serieses[i];
  };

  /**
   * Returns the [xmin, xmax] domain of the chart and adds some whitespace
   * if requested. If no data is present, the range will be 0.0-0.1
   * @param whitespace the whitespace to add in a fraction of xmin-xmax
   */
  AppChart.prototype.getXExtent = function(whitespace) {
    if (whitespace === undefined) whitespace = 0.0;
    var minX = undefined, maxX = undefined;
    // Go through all the series and find the total max / min
    for (i in this.serieses) {
      extentX = d3.extent(this.serieses[i].values, function(d) { return d.x; });
      if (minX === undefined || extentX[0] < minX) minX = extentX[0];
      if (maxX === undefined || extentX[1] > maxX) maxX = extentX[1];
    }
    if (minX === undefined) minX = 0.0;
    if (maxX === undefined) maxX = 1.0;
    return [minX - whitespace * (maxX-minX), maxX + whitespace * (maxX-minX)];
  };

  /**
   * Returns the [ymin, ymax] domain of the chart and adds some whitespace
   * if requested. If no data is present, the range will be 0.0-0.1
   * @param whitespace the whitespace to add in a fraction of xmin-xmax
   */
  AppChart.prototype.getYExtent = function(whitespace) {
    if (whitespace === undefined) whitespace = 0.0;
    var minY = undefined, maxY = undefined;
    // Go through all the series and find the total max / min
    for (i in this.serieses) {
      extentY = d3.extent(this.serieses[i].values, function(d) { return d.y; });
      if (minY === undefined || extentY[0] < minY) minY = extentY[0];
      if (maxY === undefined || extentY[1] > maxY) maxY = extentY[1];
    }
    if (minY === undefined) minY = 0.0;
    if (maxY === undefined) maxY = 1.0;
    return [minY - whitespace * (maxY-minY), maxY + whitespace * (maxY-minY)];
  };

  /**
   * Get the nearest value for all series in a hashmap mapping seriesId to
   * closest point to the coordinates supplied
   * @param x the x coordinate to search close to
   * @param y the y coordinate to search close to
   * @param t the t coordinate (time) to search close to
   */
  AppChart.prototype.getNearest = function(x, y, t) {
    hash = {};
    // go through all series
    for (i in this.serieses) {
      series = this.serieses[i];
      // use graph strategy to get closest value (different for line chart
      // and scatter plot)
      p = this.graphStrategy.getNearest(series.values, x, y, t);
      // add the value we found plus some helpful information
      hash[series.id] = {
          id: series.id, x: p.x, y: p.y, t: p.t,
          // color value based on color map (if any present)
          colorVal: this.colorMap ? this.colorMap(p.y) : false,
          // color value based on color assigned to this series
          color: series.color ? series.color : false
        };
    }
    return hash;
  };

  //---- Handling Re-Scaling Events

  /**
   * Pan the chart to a new x-/y-domain. ALL calls to rescale the graph to a
   * new domain should go here; re-drawing / re-scaling of all elements, event
   * firing etc. are done from here.
   * @param minX the new minX coordinate, supply undefined to leave unchanged
   * @param maxX the new maxX coordinate, supply undefined to leave unchanged
   * @param minY the new minY coordinate, supply undefined to leave unchanged
   * @param maxY the new maxY coordinate, supply undefined to leave unchanged
   */
  AppChart.prototype.dimensions = function(minX, maxX, minY, maxY) {
    // memorize old dimensions
    var oldMinX = this.minX, oldMaxX = this.maxX,
        oldMinY = this.minY, oldMaxY = this.maxY;
    // if anything changed at all
    if ((oldMinX !== minX && minX !== undefined) ||
        (oldMaxX !== maxX && maxX !== undefined) ||
        (oldMinY !== minY && minY !== undefined) ||
        (oldMaxY !== maxY && maxY !== undefined)) {
      // change all the things that should be changed
      if (minX !== undefined) this.minX = minX;
      if (maxX !== undefined) this.maxX = maxX;
      if (minY !== undefined) this.minY = minY;
      if (maxY !== undefined) this.maxY = maxY;
      // re-apply the x/y domain
      this.x.domain([this.minX, this.maxX]);
      this.y.domain([this.maxY, this.minY]);
      // rescale all fixed position DOM nodes
      this.scale();
      // re-draw graph
      this.draw();
    }
  };

  /**
   * Re-scale all the fixed position DOM nodes. Shortcut to scaleHandler()()
   * @see module:AppChart~AppChart#scaleHandler
   */
  AppChart.prototype.scale = function() {
    return this.scaleHandler()();
  };

  /**
   * Returns a callback that should be invoked every time the x or y dimensions
   * (domain or range) of the graph change. Some elements that are drawn on the
   * chart are fixed-position DOM elements and need re-positioning by
   * JavaScript. The callback returned by this function takes care of that.
   */
  AppChart.prototype.scaleHandler = function() {
    var self = this;
    return function() {
      // set some internal properties memorizing the space we have available
      self.clientWidth = self.containerNode.clientWidth;
      self.clientHeight = self.containerNode.clientHeight -1;
      self.size = {
        width:  self.clientWidth - self.padding.left - self.padding.right,
        height: self.clientHeight - self.padding.top - self.padding.bottom
      };
      // re-scale the top level SVG node & layers group to fit the container
      self.svgNode
          .attr("width",  self.clientWidth)
          .attr("height", self.clientHeight);
      self.layers
          .attr("width", self.clientWidth)
          .attr("height", self.clientHeight)
          // transform layers group so that pixel origin (0,0) is moved
          // left/right depending on padding for axis labels
          .attr("transform",
              "translate("+self.padding.left+","+self.padding.top+")");
      // transform/re-scale rect for catching graph events to cover graph area
      self.interactGraph
          .attr("width", self.size.width)
          .attr("height", self.size.height)
          .attr("transform",
              "translate("+self.padding.left+","+self.padding.top+")");
      // transform/re-scale rect for catching x axis events to cover x axis area
      self.interactXAxis
          .attr("width", self.size.width)
          .attr("height", self.padding.bottom)
          .attr("transform", "translate(0,"+self.size.height+")");
      // transform/re-scale rect for catching y axis events to cover y axis area
      self.interactYAxis
          .attr("width", self.padding.left)
          .attr("height", self.size.height)
          .attr("transform", "translate(-"+self.padding.left+",0)");
      // transform/re-scale graph layer (svg, see setup(...)) to show exactly
      // the window we have specified
      self.graphLayer
          .attr("width", self.size.width)
          .attr("height", self.size.height)
          .attr("viewBox", "0 0 " + self.size.width + " " + self.size.height);
      self.x = self.x.range([0, self.size.width]);
      self.y = self.y.range([0, self.size.height]);
      // move/transfrom x-axis <line> to the right place
      self.xAxisNode
          .attr("x1", 0)
          .attr("x2", self.size.width)
          .attr("transform", "translate(0,"+self.size.height+")");
      // move y-axis <line> to the right place
      self.yAxisNode
          .attr("y1", 0)
          .attr("y2", self.size.height);
      // move color map guide to the right place
      self.yGuideNode
          .attr("x", self.padding.left-10)
          .attr("width", 10)
          .attr(self.size.height);
      // if x label present, move it to the right place
      if (self.xLabelNode)
        self.xLabelNode
            .attr("x", self.size.width/2)
            .attr("y", self.size.height+5);
      // if y label present, move it to the right place
      if (self.yLabelNode)
        self.yLabelNode
            .attr("transform",
                    "translate("+-40+" "+self.size.height/2+") rotate(-90)");
      // if title present, move it to the right place
      if (self.titleNode)
        self.titleNode
            .attr("x", self.size.width/2);
    };
  };

  /**
   * Same as scaleHandler(), but calls draw() afterwards. Callback to invoke
   * everytime the container size changes and not only a re-positioning of the
   * elements, but a complete redraw is necessary.
   * @see module:AppChart~AppChart#scaleHandler
   */
  AppChart.prototype.resizeHandler = function() {
    var self = this;
    return function() {
      self.scaleHandler()();
      self.draw();
    }
  };

  //---- Handling Highlight-Events (mouseovers, marks etc.)

  /**
   * Call this method if any part of the graph should be highlighted. Method
   * calls "drawHighlights(...)" to redraw highlights if anything changed.
   * @param changedHighlights object with some of the following properties;
   *   Supply any property with "false" to unhighlight something: <ul>
   *   <li>seriesId (string) - highlight any of the data serieses</li>
   *   <li>x (float) and y (float) - highlight any of the x/y values with a
   *     marker</li>
   *   <li>thisChart (boolean) - highlight this chart</li>
   *   <li>hotspots (object) - add hotspots to this chart</li>
   */
  AppChart.prototype.highlight = function(changedHighlights) {
    var highlightsDirty = false;
    // a data series is highlighted
    if (changedHighlights.seriesId || changedHighlights.seriesId === false) {
      this.highlightedSeries = changedHighlights.seriesId;
      highlightsDirty = true;
    }
    // the x or y value to be highlighted changed
    if (changedHighlights.x || changedHighlights.x === false) {
      this.highlightedX = changedHighlights.x;
      highlightsDirty = true;
    }
    if (changedHighlights.y || changedHighlights.y === false) {
      this.highlightedY = changedHighlights.y;
      highlightsDirty = true;
    }
    // this chart is highlighted
    if (changedHighlights.thisChart !== undefined) {
      this.highlightThis = changedHighlights.thisChart;
      highlightsDirty = true;
    }
    // a hotspot is added
    if (changedHighlights.hotspots !== undefined) {
      this.highlightHotspots = changedHighlights.hotspots;
      highlightsDirty = true;
    }
    if (highlightsDirty) this.drawHighlights();
  }

  //---- Drawing the components

  /**
   * Re-draw all the components. Shortcut to drawHandler()()
   * @see module:AppChart~AppChart#drawHandler
   */
  AppChart.prototype.draw = function() {
    return this.drawHandler()();
  };

  /**
   * Returns a callback that should be invoked every time the graph should be
   * redrawn from scratch since it is re-scaled. Callback redraws all the layers
   * (grids, serieses & highlights) by using the respective draw<...>-methods.
   */
  AppChart.prototype.drawHandler = function() {
    var self = this;
    return function() {
      self.drawGrid();
      self.drawSerieses();
      self.drawHighlights();
    };
  }

  /**
   * Redraws the graphs grid. Should be called any time the grid changed
   * because of a zooming / panning event or rescaling of the graph container.
   */
  AppChart.prototype.drawGrid = function() {
    var self = this;
    // accessor methods to translate axis ticks
    var tx = function(d) { return "translate(" + self.x(d) + ", 0)"; },
        ty = function(d) { return "translate(0, " + self.y(d) + ")"; };
    // accessor method to determine the class of a grid line based on
    // whether it is the origin line or not
    var lg = function(d) { return "long " + (d ? "" : "zero"); };
    // create about 10 ticks for the x and y axis
    var fx = this.x.tickFormat(10),
        fy = this.y.tickFormat(10);
    // 1. Regenarate <g> tags for x ticks and apply the data of the ~10 ticks
    var gx = this.xTicksNode.selectAll("g")
        .data(this.x.ticks(10), String)
        .attr("transform", tx);
    // Add new x ticks and transform them into the right position
    var gxe = gx.enter().insert("g", "a")
        .attr("transform", tx);
    // Add the "short" tick line on the axis
    gxe.append("line").attr("class", "short");
    // Add the "long" grid line covering the graph
    gxe.append("line").attr("class", lg);
    // Add the text besides the tick
    gxe.append("text")
        .attr("dy", "1em")
        .attr("text-anchor", "middle")
        .text(fx);
    // Remove any ticks which disappeared
    gx.exit().remove();
    // Place everyting (texts, "short" tick lines and "long" grid lines)
    // based on the containers dimensions.
    gx.selectAll("text")
        .attr("y", this.size.height+5);
    gx.selectAll("line.long")
        .attr("y1", 0)
        .attr("y2", this.size.height);
    gx.selectAll("line.short")
        .attr("y1", this.size.height)
        .attr("y2", this.size.height+5);
    // 2. Regenarate <g> tags for y ticks and apply the data of the ~10 ticks
    var gy = this.yTicksNode.selectAll("g")
        .data(this.y.ticks(10), String)
        .attr("transform", ty);
    // Add new y ticks and transform them into the right position
    var gye = gy.enter().insert("g", "a")
        .attr("transform", ty);
    // Add the "short" tick line on the axis
    gye.append("line").attr("class", "short");
    // Add the "long" grid line covering the graph
    gye.append("line").attr("class", lg);
    // Add the text besides the tick
    gye.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(fy);
    // Remove any ticks which disappeared
    gy.exit().remove();
    // Place everyting (texts, "short" tick lines and "long" grid lines)
    // based on the containers dimensions.
    gy.selectAll("text")
        .attr("x", -5);
    gy.selectAll("line.short")
        .attr("x1", -5)
        .attr("x2", 0);
    gy.selectAll("line.long")
        .attr("x1", 0)
        .attr("x2", this.size.width);
    // 3. Regenerate y-"guides" (the color map pallette on the y axis)
    if (this.colorMap) {
      // lets have about one shade of color every 5 pixels
      var numGuides = self.size.height / 5,
          guideTicks = this.y.ticks(numGuides);
      // for each of these shades we need y coordinate and original value
      // guideRects array will hold these values
      guideRects = [];
      for (i in guideTicks)
        guideRects.push([
            // first rect (i == 0) should reach all the way down but not further
            i == 0 ? guideTicks[i] : guideTicks[i-1],
            guideTicks[i]
          ]);
      // last rect should reach all the way up but not further
      guideRects.push([guideTicks[guideTicks.length-1], this.y.invert(0)]);
      // create a "rect" for each guide shape
      gg = this.yGuideNode.selectAll("rect")
          .data(guideRects);
      // remove all guide shapes that have "disappeared"
      gg.exit().remove();
      // add new guide shapes that have entered
      gge = gg.enter().append("rect");
      // place, transform and fill shapes
      gg.attr("transform",
            function(d) { return "translate(-5, " + (self.y(d[1])) + ")"; })
        .attr("height",
            function(d) { return self.y(d[0])-self.y(d[1])+1; })
        .attr("fill",
            function(d) { return self.colorMap(d[1]); })
        .attr("width", "5");
    }
  };

  /**
   * Redraws the graphs data serieses. Call this every time the graph container
   * rescales. This method largely delegates to
   * AppGraphStrategy.drawSerieses(...)
   */
  AppChart.prototype.drawSerieses = function() {
    var self = this;
    // the "line" connecting all the data points (only really used in time
    // series visualizations)
    this.line = d3.svg.line()
      .interpolate("linear")
      .x(function(d,i) { return self.x(d.x); })
      .y(function(d,i) { return self.y(d.y); });
    // delegte to graph strategy
    if (this.seriesesNode)
      this.graphStrategy.drawSerieses(this.seriesesNode);
    // also let the user zoom / pan if he has the mouse on the series (not only
    // un the rect-area below it)
    this.graphLayer.call(
        d3.behavior.zoom().x(this.x).y(this.y).on("zoom", this.zoomHandler()));
  };

  /**
   * Redraws the graphs annotations. Needs to be supplied with an annotation
   * array. This method is usually called from the graph strategy.
   * @param data the annotation data to draw on the graph - an array of
   *   annotation objects, each with the following properties: <ul>
   *     <li>lines - an array of text lines to display</li>
   *     <li>color - a color to fill the annotation with</li>
   *     <li>anchor - the text anchor (start, middle, end)</li>
   *   </ul>
   * @param container the container to draw the data into
   */
  AppChart.prototype.drawAnnotations = function(data, container) {
    var self = this;
    // select all annotations inside the container & apply the annotation object
    textSel = container.selectAll("text.annotation");
    text = textSel.data(data);
    // remove all annotations that have dissappeared
    text.exit().remove();
    // create new annotation objects
    textEnter = text.enter().append("text").attr("class", "annotation");
    // re-place all annotation objects (in case the graph was rescaled)
    text.attr("transform",
            function (d) {
              return "translate(" + self.x(d.x) + "," + self.y(d.y) + ")";
            }
          );
    // for new annotations: fill them and add multi line text (one tspan per
    // text line)
    textLines = textEnter
        .attr("fill", function (d) { return d.color ? d.color : ""; })
        .attr("text-anchor", function (d) { return d.anchor ? d.anchor : ""; })
        .selectAll("tspan")
        .data(function (d) { return d.lines; });
    textLines.exit().remove();
    textLines.enter().append("tspan")
        .attr("dy", "1.2em") // lines have 1.2em distance from another
        .attr("x", "0")
        .text(function (d) { return d; });
  };

  /**
   * Redraws the graphs markers. Needs to be supplied with an marker array, a
   * container DOM object to specify where to draw the markers into and
   * a boolean stating whether this graph is highlighted or not. This method is
   * usually called from the graph strategy.
   * @param data the marker data to draw on the graph - an array of marker
   *   objects, each with the following properties: <ul>
   *     <li>x - the x value of the marker</li>
   *     <li>y - the y value of the marker</li>
   *     <li>t - the t value of the marker</li>
   *     <li>coords - an optional array of a combination of "x", "y", "t" to
   *       signify which labels need to be plotted next to the marker</li>
   *   </ul>
   * @param container the container to draw the data into
   * @param highlightedSeries boolean to signify if the series is highlighted or
   *   not
   */
  AppChart.prototype.drawMarkers = function(data, container,
                                            highlightedSeries) {
    var self = this, format = d3.format(".2f");
    // get all circles representing the marker points and all texts representing
    // the markers x, y & t values
    circleSel = container.selectAll("circle.marker");
    xTextSel = container.selectAll("text.x");
    yTextSel = container.selectAll("text.y");
    tTextSel = container.selectAll("text.t");
    circles = circleSel.data(data);
    // remove all disappeared, add all appeared circles
    circles.exit().remove();
    circles.enter().append("circle").attr("r", "5");
    // define class, position, stroke, filling and highlight / unhighlight
    // behaviour
    circles
        // class should capture if the series is highlighted, and if the series
        // has a color map attached
        .attr("class", function (d) {
            return (highlightedSeries === true || d.id == highlightedSeries ?
                      "highlighted" : "") +
                    " " + (d.colorVal ? "with-color-map" : "") +
                    " marker";
          })
        // coordinates
        .attr("cx", function (d) { return self.x(d.x); })
        .attr("cy", function (d) { return self.y(d.y); })
        // stroke is the color of the series, if any is defined, if not, then
        // it is the color resolved from the value-color-map, if any is present,
        // otherwise it is just black
        .attr("stroke", function (d) {
            return d.color ? d.color : d.colorVal ? d.colorVal : "black";
          })
        // fill is the color resoled from the value-color-map, if any is present
        .attr("fill", function (d) {
            return d.colorVal ? d.colorVal : "transparent";
          })
        // also highlight / unhighlight the series if hovering over the marker,
        // (the same way we do if we hover over the series itself)
        .on("mouseenter", function(d) {
            self.handleSeriesHighlighted(d.id);
          })
        .on("mouseleave", function(d) {
            self.handleSeriesUnhighlighted(d.id);
          });
    // add x value labels
    if (xTextSel) {
      // apply markers
      xTexts = xTextSel.data(data);
      // add appeared marker labels, remove disappeared ones
      xTexts.exit().remove();
      xTexts.enter().append("text").attr("class", "x");
      // define the text to display, it's position, anchor and class
      xTexts
          .text(function(d) {
              // only display text, if present & d.coords doesn't forbid
              if ((d.coords && d.coords.indexOf("x")==-1) || d.x===undefined)
                return "";
              // display text as x value + unit
              return format(d.x) +
                        (self.options.xunit ? self.options.xunit : "");
            })
          .attr("x", function(d) { return self.x(d.x); })
          .attr("y", function(d) { return self.y(d.y)+20; })
          .attr("text-anchor", "middle")
          // class should represent if series is highlighted
          .attr("class", function (d) {
              return (highlightedSeries === true || d.id == highlightedSeries ?
                        "highlighted " : "") + "x";
            });
    }
    // add y value labels
    if (yTextSel) {
      // apply markers
      yTexts = yTextSel.data(data);
      // add appeared marker labels, remove disappeared ones
      yTexts.exit().remove();
      yTexts.enter().append("text").attr("class", "y");
      // define the text to display, it's position, anchor and class
      yTexts
          .text(function(d) {
              // only display text, if present & d.coords doesn't forbid
              if ((d.coords && d.coords.indexOf("y")==-1) || d.y === undefined)
                return "";
              // display text as y value + unit
              return format(d.y) +
                        (self.options.yunit ? self.options.yunit : "");
            })
          .attr("x", function(d) { return self.x(d.x)-10; })
          .attr("y", function(d) { return self.y(d.y)+3; })
          .attr("text-anchor", "end")
          // class should represent if series is highlighted
          .attr("class", function (d) {
              return (highlightedSeries === true || d.id == highlightedSeries ?
                        "highlighted " : "") + "y";
            });
    }
    // add t value labels
    if (tTextSel) {
      // apply markers
      tTexts = tTextSel.data(data);
      // add appeared marker labels, remove disappeared ones
      tTexts.exit().remove();
      tTexts.enter().append("text").attr("class", "t");
      // define the text to display, it's position, anchor and class
      tTexts
          .text(function(d) {
              // only display text, if present & d.coords doesn't forbid
              if ((d.coords && d.coords.indexOf("t")==-1) || d.t === undefined)
                return "";
              // display text as t value + unit
              return format(d.t) +
                        (self.options.tunit ? self.options.tunit : "");
            })
          .attr("x", function(d) { return self.x(d.x)+10; })
          .attr("y", function(d) { return self.y(d.y)+3; })
          // class should represent if series is highlighted
          .attr("class", function (d) {
              return (highlightedSeries === true || d.id == highlightedSeries ?
                        "highlighted " : "") + "t";
            });
    }
  };

  /**
   * Redraws the graphs hotspots. Needs to be supplied with an hotspot array and
   * a container DOM object where to draw the objects into. This method is
   * called from drawHighlights(...) since hotspots are considered highlights.
   * @param data the hotspot data to draw on the graph - an array of hotspot
   *   objects, each with the properties x0, y0, x1, y1 to specify the area
   *   that the hotspot may cover and the property "seriesId" signifying the
   *   series this hotspot belongs to.
   * @param container the container to draw the hotspots into
   */
  AppChart.prototype.drawHotspots = function(data, container) {
    var self = this;
    // select all rects with hotspot class
    hotspotSel = container.selectAll("rect.hotspot")
    // if no hotspots are defined just safely assume an empty array
    if (!data) data = [];
    // filter the array to extract only the series we are currently plotting
    if (this.seriesId)
      data = data.filter(function (d) {
        return (d.seriesId == self.seriesId);
      });
    // apply the data to the DOM nodes
    hotspots = hotspotSel.data(data);
    // remove all disappeared hotspots, add all appeared hotspots
    hotspots.exit().remove();
    hotspots.enter().append("rect")
      .attr("class", "hotspot")
      .attr("rx", "5")
      .attr("ry", "5");
    // place the hotspots correctly
    hotspots
      .attr("x",
          function (d) { return Math.min(self.x(d.x0),self.x(d.x1)); })
      .attr("y",
          function (d) { return Math.min(self.y(d.y0),self.y(d.y1)); })
      .attr("width",
          function (d) { return Math.abs(self.x(d.x1)-self.x(d.x0)); })
      .attr("height",
          function (d) { return Math.abs(self.y(d.y0)-self.y(d.y1)); });
  };

  /**
   * Redraws the graphs highlights based on the internal highlight state
   */
  AppChart.prototype.drawHighlights = function() {
    var self = this;
    // highlight any points close to the specified "highlightX" / "highlightY"
    // location and draw the associated markers
    hash = this.getNearest(this.highlightedX, this.highlightedY);
    data = [];
    for (k in hash)
      data.push(hash[k]);
    if (this.highlightedX !== false) {
      this.drawMarkers(data, this.highlightXYNode, this.highlightedSeries);
    } else if (this.highlightedX === false) {
      this.drawMarkers([], this.highlightXYNode, this.highlightedSeries);
    }
    // highlight this graph if "highlightThis" is true (e.g. on mouseover)
    this.layers.attr("class",
        (this.highlightThis ? "highlighted" : "unhighlighted") + " app-chart");
    // highlight any series if "highlightedSeries" is specified
    if (this.seriesNode)
      this.seriesNode.attr("class", function(d) {
          return (d.id == self.highlightedSeries ?
                  "highlighted " : "unhighlighted") + " series";
        });
    // draw hotspots if "highlightHotspots" is defined
    this.drawHotspots(this.highlightHotspots, this.hotspotLayer);
  };

  //---- Internal callbacks (functions consuming events)

  /**
   * Return internal callback invoked if started dragging on the x axis
   */
  AppChart.prototype.draggingXStartedHandler = function() {
    var self = this;
    return function() {
      document.onselectstart = function() { return false; };
      var p = d3.mouse(self.layers[0][0]);
      // safe where we started dragging
      self.draggingX = self.x.invert(p[0]);
    };
  };

  /**
   * Return internal callback invoked if started dragging on the y axis
   */
  AppChart.prototype.draggingYStartedHandler = function() {
    var self = this;
    return function() {
      document.onselectstart = function() { return false; };
      var p = d3.mouse(self.layers[0][0]);
      // safe where we started dragging
      self.draggingY = self.y.invert(p[1]);
    };
  };

  /**
   * Return internal callback invoked if moving the mouse while dragging.
   */
  AppChart.prototype.mouseDraggedHandler = function() {
    var self = this;
    return function() {
      var p = d3.mouse(self.layers[0][0]), // mouse coordinates
          t = d3.event.changedTouches,
          x = self.x.invert(p[0]), // x value from domain
          y = self.y.invert(p[1]), // y value from domain
          newMaxX = undefined, newMaxY = undefined;
      // we are currently dragging the x axis
      if (self.draggingX !== undefined) {
        if (x != 0) {
          var changeX = self.draggingX / x;
          newMaxX = self.minX + (self.x.domain()[1] - self.minX) * changeX;
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
      // we are currently dragging the y axis
      if (self.draggingY !== undefined) {
        if (y != 0) {
          var changeY = self.draggingY / y;
          newMaxY = self.minY + (self.y.domain()[0] - self.minY) * changeY;
        }
        d3.event.preventDefault();
        d3.event.stopPropagation();
      }
      // if we dragged on x and why and we didn't end up with strange
      // coordinates, rescale the graph
      if (newMaxX !== undefined || newMaxY !== undefined) {
        self.dimensions(undefined, newMaxX, undefined, newMaxY);
        // also invoke all zoom/pan handlers
        self.handleZoomedPanned();
      }
    };
  };

  /**
   * Return internal callback invoked if moving the mouse.
   */
  AppChart.prototype.mouseMovedHandler = function() {
    var self = this;
    return function() {
      var p = d3.mouse(self.layers[0][0]),
          x = self.x.invert(p[0]),
          y = self.y.invert(p[1]);
      // invoke any external callbacks
      self.handleMouseMoved(x, y);
      return false;
    };
  };

  /**
   * Return internal callback invoked if the graph was zoomed by the d3.js
   * internal zooming behaviour
   */
  AppChart.prototype.zoomHandler = function() {
    var self = this;
    return function() {
      // get the new dimentsions (which are automatically set by d3.js)
      minX = self.x.domain()[0];
      maxX = self.x.domain()[1];
      maxY = self.y.domain()[0];
      minY = self.y.domain()[1];
      // apply those dimensions how we are doing it
      self.dimensions(minX, maxX, minY, maxY);
      // invoke external callbacks
      self.handleZoomedPanned();
    };
  };

  /**
   * Return internal callback invoked if the mouse is released after a dragging
   * event
   */
  AppChart.prototype.mouseReleasedHandler = function() {
    var self = this;
    return function() {
      document.onselectstart = function() { return true; };
      // reset internal state
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
  };

  /**
   * Return internal callback invoked if the mouse enters the graph area
   */
  AppChart.prototype.mouseEnterHandler = function(f) {
    var self = this;
    return function() {
      // invoke external callback
      self.handleMouseEnter();
    };
  };

  /**
   * Return internal callback invoked if the mouse leaves the graph area
   */
  AppChart.prototype.mouseLeaveHandler = function(f) {
    var self = this;
    return function() {
      // invoke external callback
      self.handleMouseLeave();
    };
  };

  //---- Attaching external callbacks

  /**
   * Attach a callback to be invoked every time a series gets highlighted
   * @param f the callback function - can take one argument, the seriesId
   */
  AppChart.prototype.attachSeriesHighlightedHandler = function(f) {
    this.seriesHighlightedHandlers.push(f);
  };

  /**
   * Attach a callback to be invoked every time a series gets unhighlighted
   * @param f the callback function - can take one argument, the seriesId
   */
  AppChart.prototype.attachSeriesUnhighlightedHandler = function(f) {
    this.seriesUnhighlightedHandlers.push(f);
  };

  /**
   * Attach a callback to be invoked every time the graph is zoomed/panned
   * @param f the callback function - can take 4 arguments: minX, maxX, minY,
   *   maxY
   */
  AppChart.prototype.attachZoomedPannedHandler = function(f) {
    this.zoomedPannedHandlers.push(f);
  };

  /**
   * Attach a callback to be invoked every time the mouse enters the graph
   * @param f the callback function
   */
  AppChart.prototype.attachMouseEnterHandler = function(f) {
    this.mouseEnterHandlers.push(f);
  };

  /**
   * Attach a callback to be invoked every time the mouse leaves the graph
   * @param f the callback function
   */
  AppChart.prototype.attachMouseLeaveHandler = function(f) {
    this.mouseLeaveHandlers.push(f);
  };

  /**
   * Attach a callback to be invoked every time the mouse is moved inside the
   * graph
   * @param f the callback function
   */
  AppChart.prototype.attachMouseMovedHandler = function(f) {
    this.mouseMovedHandlers.push(f);
  };

  //---- Invoking external callbacks

  /**
   * Invoke all callbacks to handle the event of a highlighted series
   * @param id the series that was highlighted
   */
  AppChart.prototype.handleSeriesHighlighted = function(id) {
    for (i in this.seriesHighlightedHandlers) {
      this.seriesHighlightedHandlers[i](id);
    }
  };

  /**
   * Invoke all callbacks to handle the event of a unhighlighted series
   * @param id the series that was unhighlighted
   */
  AppChart.prototype.handleSeriesUnhighlighted = function(id) {
    for (i in this.seriesHighlightedHandlers) {
      this.seriesUnhighlightedHandlers[i](id);
    }
  };

  /**
   * Invoke all callbacks to handle the event of a graph zoom/pan action
   */
  AppChart.prototype.handleZoomedPanned = function() {
    for (i in this.zoomedPannedHandlers) {
      this.zoomedPannedHandlers[i](
          this.minX, this.maxX, this.minY, this.maxY
        );
    }
  };

  /**
   * Invoke all callbacks to handle the event of a mouse enter
   */
  AppChart.prototype.handleMouseEnter = function() {
    for (i in this.mouseEnterHandlers) {
      this.mouseEnterHandlers[i]();
    }
  };

  /**
   * Invoke all callbacks to handle the event of a mouse leave
   */
  AppChart.prototype.handleMouseLeave = function() {
    for (i in this.mouseLeaveHandlers) {
      this.mouseLeaveHandlers[i]();
    }
  };

  /**
   * Invoke all callbacks to handle the event of a mouse move
   */
  AppChart.prototype.handleMouseMoved = function(x, y) {
    for (i in this.mouseMovedHandlers) {
      this.mouseMovedHandlers[i](x, y);
    }
  };

  return AppChart;

});
