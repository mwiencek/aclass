module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      options: {
        globals: { define: false, module: false },
        camelcase: true,
        curly: true,
        eqeqeq: true,
        indent: 4,
        newcap: true,
        noarg: true,
        nonew: true,
        quotmark: "double",
        undef: true,
        unused: true,
        strict: true,
        trailing: true,
        maxlen: 79
      }
    },
    jasmine: {
      aclass: {
        src: "aclass.js",
        options: {
          specs: "specs/specs.js"
        }
      }
    },
    uglify: {
      options: {
        banner: "// <%= pkg.name %> <%= pkg.version %> (https://github.com/mwiencek/aclass)\n" +
                "// License: MIT (http://opensource.org/licenses/MIT)\n",
        mangle: true,
        compress: true,
        preserveComments: false

      },
      build: {
        src: "<%= pkg.name %>.js",
        dest: "<%= pkg.name %>.min.js"
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-jasmine");
  grunt.loadNpmTasks("grunt-contrib-uglify");

  grunt.registerTask("default", ["jshint", "jasmine", "uglify"]);
};
