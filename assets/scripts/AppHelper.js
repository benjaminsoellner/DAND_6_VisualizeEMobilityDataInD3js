define([], function() {

  AppHelper = {};

  AppHelper.getSeriesDataTransformer = function(xKey, yKey, tKey) {
    return function(data) {
      return data.serieses.map(function(series) {
          series.values = [];
          for (var i = 0; i < series[xKey].length; i++) {
            value = { x: series[xKey][i], y: series[yKey][i] }
            if (tKey !== undefined)
              value.t = series[tKey][i];
            series.values.push(value);
          }
          return series;
        });
    }
  };

  AppHelper.trimSvg = function(svg) {
    bbox = svg[0].getBBox();
    vbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
    svg[0].setAttribute("viewBox", vbox);
    svg[0].removeAttribute("height");
    svg[0].removeAttribute("width");
  }

  return AppHelper;

});
