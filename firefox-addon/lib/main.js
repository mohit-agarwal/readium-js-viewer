'use strict';

const tabs = require("sdk/tabs");
const timers = require('sdk/timers');
const widgets = require("sdk/widget");
// const pageMod = require("sdk/page-mod");

const protocol = require('./jetpack-protocol/index');
const resource = require('resource');

// var self = require('self') // Simulator
// var self = new function Self() {
//         const dataDir = rootDir + 'data/';
//         this.data = {
//             url: function(path) {
//                 return rootDir + path;
//             }
//         }
//     };
const self = require("sdk/self");

const URI_SCHEME = "readium";

// readium/
const rootDir = module.id.substr(0, module.id.lastIndexOf('/') + 1);

//resource://jid1-o4gyqlfagd1yhq-at-jetpack/readium/data/index.html
const readiumURL = self.data.url("index.html");


//resource:readium or resource://readium/
resource.set('readium', readiumURL);
//resource.set('readium', URI_SCHEME + "://" + rootDir + "index.html");


var _workers = [];

function detachWorker(worker) {
    var index = _workers.indexOf(worker);
    if (index != -1) {
        _workers.splice(index, 1);
    }
}

function getWorker(tab) {
    for (var i = _workers.length - 1; i >= 0; i--) {
        if (_workers[i].tab === tab) return _workers[i];
    }
    return undefined;
}

exports.handler = protocol.protocol(URI_SCHEME, {
    isAbsolute: function(uri) {
        return uri.indexOf(URI_SCHEME + ':') === 0
    },
    onRequest: function(request, response) {
        console.log('>>>>>>>>>> REQUEST: ', JSON.stringify(request, '', '  '));

        var str = URI_SCHEME + "://" + rootDir;

        var token = URI_SCHEME + ":///";

        // ensure non-empty domain (replace with rootDir)
        var requesturi = request.uri;
        if (requesturi.replace(/\//g, '') === "readium:") {
            requesturi = str;

            response.uri = requesturi;
            return;
        } else if (requesturi.indexOf(token) === 0) {
            requesturi = requesturi.replace(token, str);

            response.uri = requesturi;
            return;
        }


        var index = requesturi.indexOf(str);
        if (index === 0) {
            //readium://readium/images/library_arrow.png?test=daniel#id
            //readium://readium/index.html?test=daniel#id
            //readium://readium/?test=daniel#id

            var path = requesturi.substr(str.length);

            if (path === "epub_library.json") {
                response.contentType = "application/json; charset=utf-8";
                response.contentLength = 2;
                response.end('{}');
                return;
            } else if (/^[0-9]/.test(path.charAt(0))) { // EPUB package data!

                var worker = getWorker(tabs.activeTab);

                worker.port.once("gotEpubFileText", function(src) {

                    var bytes = encodeURI(src).split(/%..|./).length - 1;
                    // var m = encodeURIComponent(src).match(/%[89ABab]/g);
                    // bytes = src.length + (m ? m.length : 0);

                    response.contentType = "text/plain; charset=utf-8";

                    response.contentLength = bytes;

                    response.end(src);

                    console.log('}}}}}}}}}}}}}}} RESPONSE: ', JSON.stringify(response, '', '  '));
                });
                worker.port.emit("getEpubFileText", path);

                return;
            }

            var query = path.indexOf('?');
            if (query >= 0) {
                var l = query;
                query = path.substr(query);
                path = path.substr(0, l);
            } else {
                query = "";
            }

            var hash = query.indexOf('#');
            if (hash >= 0) {
                var ll = hash;
                hash = query.substr(hash);
                query = query.substr(0, ll);
            } else {
                hash = "";
            }

            var url = self.data.url("index.html");
            if (path.length > 0) {
                url = self.data.url(path);
            }
            url = url + query + hash;

            console.log("***************** URL: " + url);
            response.uri = url;

            return;
        }

        response.uri = "http://daisy.org";
        return;



        // response.contentType = "text/html";
        // response.write('Hello ');
        // response.write('<h1>Jedi is an awsome dude with a lightsaber!!</h1>');
        // response.end('World !');


    },

    //onResolve: function(relative, base) {
    // if (this.isAbsolute(relative))
    // {
    //     console.log("abs: "+ relative);
    //     return relative;
    // }
    // else
    // {
    //     var full = base + relative;
    //     console.log("rel: "+ full);
    //     return full;
    // }
    //}
});
exports.handler.register();
// exports.handler.unregister()



var inject = {
    contentScriptWhen: 'ready',
    include: "readium://readium/*",

    // TODO: real script, real fetching of EPUB package data
    //contentScriptFile: data.url("element-getter.js"),
    contentScript: 'self.port.on("getEpubFileText", function(path) { var src = \'<?xml version="1.0" encoding="UTF-8"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>\'; self.port.emit("gotEpubFileText", src); });',

    onAttach: function(worker) {
        
        if (!worker.tab) {
            console.log("onAttach() !worker.tab => skip...");
            return;
        }
        
        if (worker.tab !== tabs.activeTab) {
            console.log("worker.tab  !== tabs.activeTab ?");
        }
        
        console.log("||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||");

        // console.log(typeof worker);
        // for (var prop in worker)
        // {
        //     if (true || worker.hasOwnProperty(prop))
        //     {
        //         console.log(prop);
        //         console.log(worker[prop]);
        //     }
        // }
        
        console.log(worker.tab.title);

        _workers.push(worker);
        
        if (!worker.port) {
            console.log("onAttach() !worker.port ??");
            return;
        }
        
        worker.port.on('detach', function() {
            detachWorker(this);
        });
    }
};

// pageMod.PageMod(inject);
var widget = widgets.Widget({
    id: "readium",
    label: "Readium EPUB reader",
    contentURL: self.data.url("images/readium_favicon.png"),
    onClick: function() {
        //var url = self.data.url("index.html");
        //var url = "resource://readium";
        var url = URI_SCHEME + "://" + rootDir + "index.html";

        tabs.open(url);

        timers.setTimeout(function() {
            var worker = tabs.activeTab.attach(inject);
            inject.onAttach(worker);

            // timers.setTimeout(function() {
            //         console.log("TAB onAtttach");
            // 
            //         var worker = getWorker(tabs.activeTab);
            //         inject.onAttach(worker);
            // }, 100);
        }, 100);
    }
});
