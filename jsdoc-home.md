![Comic Logo of this Udacity Project](../images/dand6_comic_normal.png)

# Welcome

This documentation is for the curious mind who wants to understand and potentially re-use the code of this visualization. Feel free to browse the modules and classes of the project.

## How to start

Before diving into the API Doc and into the code, there are a few conceptual documents listed under "Tutorials" that I recommend reading to get a general understanding about the source code:

* [File & Directory Structure][doc-1FileDirectoryStructure] contains a general "what is where" of the repository.
* [Terminology][doc-2Terminology] describes a number of clearly defined concepts you see on the screen of the application.
* [JSON Class Structure of Data Files][doc-3JSONDataStructure] contains the file structure of the visualized data and may be especially useful for readers that want to swap out the dataset with other data.
* [Components of the Application][doc-4Components] describes the components you see on the web application. This application uses [AngularJS][angularjs], a framework that lets us define "extensions" to HTML and attach custom behaviours to those new elements. For drawing the charts, dropdowns, battery schematics etc. this is heavily used.
* [Interaction of the Components][doc-5ComponentsInteraction] explains how the components described above exchange data so they all update simultaneously and thusly provide a consistent user experience.
* [Layers in the AppChart D3.js Graph][doc-6LayersAppChart] goes into deeper detail about how our chart implementation's internal SVG layering is designed so that all small things of the chart, like axes, labels, data points etc. all fall into place at the right position.

### Frameworks Used & Copyrights

* [Bootstrap][bootstrap] ([MIT License][bootstrap-license])
* [Bootstrap Sass][bootstrap-sass]
* [jQuery][jquery] ([MIT License][jquery-license])
* [AngularJS][angularjs] ([MIT License][angularjs-license])
* [D3.js][d3js] ([BSD License][d3js-license])
* [Requirejs][requirejs] ([New BSD or MIT License][requirejs-license])
* [Underscore][underscore] ([License][underscore-license])
* [JSDoc][jsdoc] ([Apache License 2.0][jsdoc-license])
* [JSDoc Bootstrap / Docstrap][docstrap] ([License][docstrap-license])
* [ElementQueries, ResizeSensor][elementqueries]

For development:

* [Grunt][grunt]
* [NodeJS][nodejs]
* [grunt-contrib-requirejs][grunt-contrib-requirejs]
* [grunt-jsdoc][grunt-jsdoc]
* [Jade][jade]
* [Sass][sass]

<!-- External Content: Frameworks -->
[d3js]: https://d3js.org/
[d3js-license]: https://opensource.org/licenses/BSD-3-Clause
[angularjs]: https://angularjs.org/
[angularjs-license]: https://github.com/angular/angular.js/blob/master/LICENSE
[bootstrap]: http://getbootstrap.com/
[bootstrap-license]: https://github.com/twbs/bootstrap/blob/master/LICENSE
[bootstrap-sass]: https://www.npmjs.com/package/bootstrap-sass
[jquery]: https://jquery.com/
[jquery-license]: https://tldrlegal.com/license/mit-license
[requirejs]: http://requirejs.org/
[requirejs-license]: https://github.com/requirejs/requirejs/blob/master/LICENSE
[underscore]: http://underscorejs.org/
[underscore-license]: https://github.com/jashkenas/underscore/blob/master/LICENSE
[jsdoc]: http://usejsdoc.org/
[jsdoc-license]: http://usejsdoc.org/about-license-jsdoc3.html
[docstrap]: https://github.com/docstrap/docstrap
[docstrap-license]: https://github.com/docstrap/docstrap/blob/master/LICENSE.md
[elementqueries]: https://github.com/marcj/css-element-queries
[elementqueries-license]: https://github.com/marcj/css-element-queries/blob/master/LICENSE

[grunt]: http://gruntjs.com/
[nodejs]: https://nodejs.org/en/
[grunt-contrib-requirejs]: https://github.com/gruntjs/grunt-contrib-requirejs
[grunt-jsdoc]: https://github.com/krampstudio/grunt-jsdoc
[jade]: http://jade-lang.com/
[sass]: http://sass-lang.com/

<!-- Here -->
[doc-1FileDirectoryStructure]: tutorial-1FileDirectoryStructure.html
[doc-2Terminology]: tutorial-1FileDirectoryStructure.html
[doc-3JSONDataStructure]: tutorial-1FileDirectoryStructure.html
[doc-4Components]: tutorial-1FileDirectoryStructure.html
[doc-5ComponentsInteraction]: tutorial-1FileDirectoryStructure.html
[doc-6LayersAppChart]: tutorial-1FileDirectoryStructure.html
