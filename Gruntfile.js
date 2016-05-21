// Gruntfile to ease javascript development
// Run Node.js server and execute "grunt <target>"
// Don't forget to install all packages before using "npm install".
// The packages are specified in package.json

module.exports = function(grunt) {

  grunt.initConfig({
    requirejs: {
      compile: {
        options: {
          baseUrl: "js",
          mainConfigFile: "js/main.js",
          include: "main.js",
          out: "js/all.min.js",
          optimize: "uglify"
        }
      }
    },
    jsdoc : {
      dist : {
        src: ["js/*.js"],
        options: {
          destination: "doc",
          configure: "jsdoc/jsdoc.config.json",
          template: "node_modules/ink-docstrap/template",
          readme: "jsdoc/jsdoc-home.md"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-jsdoc');

};
