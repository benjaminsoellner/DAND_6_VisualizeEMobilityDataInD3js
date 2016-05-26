The directory structure of the application consists of the following directories which I roughly group into 3 groups: Web Application Code, Data & Data Analysis, Documentation.

### Web Application Code

* ``/``: contains the ``index.html`` file with all hooks to CSS and JavaScript code, also a few files for the development & build process (package.json, Gruntfile, testeserver.bat) and the central [README.md](../README.md)
  * For all HTML files I use a HTML Preprocessor [Jade][jade] that lets me  write shorthand-HTML, so for each ``.html`` file, there is a ``.jade`` file which also may be more extensively commented (assuming that people who will want to look into the code mostly doing so by browsing the GitHub repository, not the original HTML source).
* ``/js``: JavaScript files
  * All external libraries ares stored in ``/js/ext``.
  * Code for all [Angular Components](tutorial-2Components.html) is stored under their respective ``/js/<Component>.js`` file.
  * Code for all other (helper) classes is stored under the ``js/<Class>.js``.
  * All code from all JavaScript files is referenced and dynamically loaded using the [Requirejs][requirejs] loader and the central ```js/main.js``` script
  * Using [Grunt][grunt], for production use, I minify the code into one single file ``/js/all.min.js``
* ``/css``: Stylesheets
  * All external CSS files (currently only Bootstrap styles) are in ``/css/ext``.
  * I use a CSS preprocessor [Sass][sass] which lets me write shorthand-CSS, comment it and pull all CSS files into one single "minified" CSS files.
  * For any [Angular Components](tutorial-4Components.html) that needs a CSS file, there is one in ``/css/_<Component>.sass``.
  * There are also a few "purpose-centric" Sass-file, like one for every "view" or one for "resets" or the "main grid" (``_explore.sass``, ``_resets.sass``, ``_main.sass`` etc.)
  * All those SASS files are pulled together by one ``main.sass`` file into a minified CSS file ``main.min.css`` which is referenced from the website.
* ``/templates``: for all [Angular Components](tutorial-4Components.html) their respective HTML template in ``<Component>.jade/.html``.
* ``/fonts``: webfonts referenced from the CSS style sheets.
* ``/images``: images used across the website as stylistic elements.
* ``/views``: HTML/Jade files, one for every "view". A view is a page page which is reachable from the main navigation and included at the top level in the ``index.html``. E.g., the explanatory analysis view is stored at ``/views/_explanatory.html``.

### Data & Data Analysis

* ``/data``: "wrangled" data the visualization application loads, see [JSON Data Structure](tutorial-3JSONDataStructure.html) - will also contain any external static images needed for the visualization
* ``/rawdata``: raw data as it was supplied to me by the data source ("unwrangled")
* ``/tools``: "data wrangling tools", written Python and Explorative Data Analysis Code written in R.

### Documentation

* ``/doc``: Javascript documentation that was generated from the original ``.js`` files using [JSDoc][jsdoc] and [grunt-jsdoc][grunt-jsdoc]
* ``/jsdoc``: these documentation files and all associated resources
* ``/readme``: all ressources (especially images) asssociated with the top-level ``README.md`` and project introduction.

[jade]: http://jade-lang.com/
[sass]: http://sass-lang.com/
[requirejs]: http://requirejs.org/
[jsdoc]: http://usejsdoc.org/
[grunt-jsdoc]: https://github.com/krampstudio/grunt-jsdoc
