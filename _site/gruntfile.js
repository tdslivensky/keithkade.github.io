/*global module*/
module.exports = function(grunt) {

  grunt.initConfig({
    imagemin: {                          // Task
        jpg: {
          options: {
            progressive: true
          },
          files: [
            {
              expand: true,
              cwd: 'img/',
              src: ['*.jpg'],
              dest: 'img/compressed/',
              ext: '.jpg'
            }
          ]
        },
        png: {
            files: [
            {
              expand: true,
              cwd: 'img/',
              src: ['*.png'],
              dest: 'img/compressed/',
              ext: '.png'
            }
          ]
        }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-imagemin');

  grunt.registerTask('default', ['imagemin']);

};