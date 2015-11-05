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
              cwd: 'img/digitalPainting/',
              src: ['*.jpg'],
              dest: 'img/digitalPainting/compressed/',
              ext: '.jpg'
            }
          ]
        },
        png: {
            files: [
            {
              expand: true,
              cwd: 'img/digitalPainting/',
              src: ['*.png'],
              dest: 'img/digitalPainting/compressed/',
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