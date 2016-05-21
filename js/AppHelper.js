/**
 * Helper module to assist with helper functions, e.g. for transforming data
 * @module AppHelper
 * @exports AppHelper
 */
define([], function() {

  /**
   * Helper singleton containing all one-time static functions
   * @constructor
   */
  AppHelper = {};

  /**
   * Function to reshape a series object from containing column-wise data like
   * x: [0,1,2,3], y: [2,3,4,5], t: [5,6,7,8] to row-wise data like
   * values: [&#123;0,2,5&#125;, &#123;1,3,6&#125;, ...] etc.
   * @param xKey the x property name to use in the original data
   * @param yKey the y property name to use in the original data
   * @param tKey the t property name to use in the original data
   */
  AppHelper.getSeriesDataTransformer = function(xKey, yKey, tKey) {
    return function(data) {
      return data.serieses.map(function(series) {
          series.values = [];
          for (var i = 0; i < series[xKey].length; i++) {
            value = { x: series[xKey][i], y: series[yKey][i] };
            if (tKey !== undefined)
              value.t = series[tKey][i];
            series.values.push(value);
          }
          return series;
        });
    }
  };

  /**
   * Function to trim all white space from around a SVG DOM element
   * @param svg the SVG DOM element
   */
  AppHelper.trimSvg = function(svg) {
    bbox = svg[0].getBBox();
    vbox = [bbox.x, bbox.y, bbox.width, bbox.height].join(" ");
    svg[0].setAttribute("viewBox", vbox);
    svg[0].removeAttribute("height");
    svg[0].removeAttribute("width");
  };

  return AppHelper;

});
