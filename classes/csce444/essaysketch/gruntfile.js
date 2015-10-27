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