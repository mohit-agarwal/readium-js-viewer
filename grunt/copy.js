'use strict';

module.exports = function(grunt) {

    return {
        firefoxAddon: {
            files: [{
                expand: true,
                cwd: 'firefox-addon',
                src: ['icons/*.*', 'package.json'],
                dest: 'build/firefox-addon'
            }, {
                expand: true,
                cwd: 'firefox-addon/lib',
                src: ['main.js', 'resource.js'],
                dest: 'build/firefox-addon/lib'
            }, {
                expand: true,
                cwd: 'firefox-addon/lib',
                src: 'jetpack-protocol/**',
                dest: 'build/firefox-addon/lib'
            }, {
                expand: true,
                cwd: 'firefox-addon/data',
                src: ['index.html', 'extended-config.js'],
                dest: 'build/firefox-addon/data'
            }, {
                expand: true,
                src: 'images/**',
                dest: 'build/firefox-addon/data'
            }, {
                expand: true,
                cwd: 'i18n',
                src: '_locales/**',
                dest: 'build/firefox-addon/data'
            }, {
                expand: true,
                cwd: 'lib/thirdparty/',
                src: ['inflate.js', 'deflate.js'],
                dest: 'build/firefox-addon/data'
            }, {
                expand: true,
                cwd: 'css',
                src: 'annotations.css',
                dest: 'build/firefox-addon/data/css'
            }, {
                expand: true,
                src: 'fonts/**',
                dest: 'build/firefox-addon/data'
            }]
        },
        chromeApp: {
            files: [{
                expand: true,
                cwd: 'chrome-app/',
                src: ['icons/*.*', 'index.html', 'background.js', 'extended-config.js', 'manifest.json'],
                dest: 'build/chrome-app'
            }, {
                expand: true,
                src: 'images/**',
                dest: 'build/chrome-app'
            }, {
                expand: true,
                cwd: 'i18n',
                src: '_locales/**',
                dest: 'build/chrome-app'
            }, {
                expand: true,
                cwd: 'lib/thirdparty/',
                src: ['inflate.js', 'deflate.js'],
                dest: 'build/chrome-app'
            }, {
                expand: true,
                cwd: 'css',
                src: 'annotations.css',
                dest: 'build/chrome-app/css'
            }, {
                expand: true,
                src: 'fonts/**',
                dest: 'build/chrome-app'
            }]
        },
        chromeAppDevBuild: {
            files: [{
                expand: true,
                cwd: 'chrome-app/icons/devBuild/',
                src: ['*.*'],
                dest: 'build/chrome-app/icons/'
                /* , rename: function(dest, src) { return dest + '/' + src } */
            }]
        },
        cloudReader: {
            files: [{
                expand: true,
                cwd: 'chrome-app/',
                src: 'index.html',
                dest: 'build/cloud-reader'
            }, {
                expand: true,
                src: 'images/**',
                dest: 'build/cloud-reader'
            }, {
                expand: true,
                src: 'fonts/**',
                dest: 'build/cloud-reader'
            }, {
                expand: true,
                cwd: 'css',
                src: 'annotations.css',
                dest: 'build/cloud-reader/css'
            }, ]
        },
        cloudReaderEpubContent: {
            files: [{
                expand: true,
                src: 'epub_content/**/*.*',
                dest: 'build/cloud-reader'
            }]
        },
        readiumjs: {
            files: [{
                expand: true,
                cwd: 'readium-js/out/',
                src: 'Readium.js',
                dest: 'lib'
            }]
        },
        prepareChromeAppTests: {
            files: [{
                expand: true,
                cwd: 'chrome-app/tests/',
                src: 'manifest.json',
                dest: 'build/chrome-app'
            }]
        }
    };
};
