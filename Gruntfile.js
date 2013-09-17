module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'lib/*.js',
        'test/*.js',
      ]
    },
    "mochaTest": {
      test: {
        options: {
          ui: 'bdd'
        },
        src: ['test/*.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('test', ['jshint', 'mochaTest']);
};