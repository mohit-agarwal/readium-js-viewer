'use strict';

module.exports = function(grunt) {

    grunt.registerTask("firefoxAddonSDK", function() {

        var path = require('path');
        
        var firefoxJetpackPath = "/Applications/addon-sdk-1.16";
        var buildFolder = path.join(process.cwd(), 'build/firefox-addon');
        
        grunt.task.run('shell:firefoxAddonSDK:' + firefoxJetpackPath + ':' + buildFolder);
        //var opt = grunt.option('??');
    });
    
    return {};
};
