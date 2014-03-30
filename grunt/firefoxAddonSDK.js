'use strict';

module.exports = function(grunt) {

    grunt.registerTask("firefoxAddonSDK", function(command) {

        var path = require('path');
        
        var firefoxJetpackPath = "/Applications/addon-sdk-1.16";
        var buildFolder = path.join(process.cwd(), 'build/firefox-addon');
        
        command = command || "run"; // run, or xpi
        
        grunt.task.run('shell:firefoxAddonSDK:' + firefoxJetpackPath + ':' + buildFolder + ':' + command);
        //var opt = grunt.option('??');
    });
    
    return {};
};
