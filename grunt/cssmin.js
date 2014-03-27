'use strict';

module.exports = function(grunt) {

    return {
        firefoxAddon: {
            files: {
                'build/firefox-addon/data/css/readium-all.css': ['css/sourcesanspro.css', 'css/bootstrap.css', 'css/readium_js.css', 'css/viewer.css', 'css/library.css']
            }
        },
        chromeApp: {
            files: {
                'build/chrome-app/css/readium-all.css': ['css/sourcesanspro.css', 'css/bootstrap.css', 'css/readium_js.css', 'css/viewer.css', 'css/library.css']
            }
        },
        cloudReader: {
            files: {
                'build/cloud-reader/css/readium-all.css': ['css/sourcesanspro.css', 'css/bootstrap.css', 'css/readium_js.css', 'css/viewer.css', 'css/library.css']
            }
        }
    };
};
