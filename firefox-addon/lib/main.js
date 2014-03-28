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
console.log("########### detach?");
    var index = _workers.indexOf(worker);
    if (index != -1) {
console.log("########### detachWorker");
        _workers.splice(index, 1);
    }
}

function getWorker(tab) {
    for (var i = _workers.length - 1; i >= 0; i--) {
        if (_workers[i].tab === tab) return _workers[i];
    }
    return undefined;
}



var _responses = {};
var _response = -1;

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
                console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% FETCH epub_library.json");

                // response.contentType = "application/json; charset=utf-8";
                // response.end('{"title" : "EPUB3 title", "author" : "Author", "packagePath" : "EPUB/package.opf", "rootUrl" : "readium://readium/1396025669514139", "rootDir": "1396025669514139", "id": "dc:identifer" }');

                var worker = getWorker(tabs.activeTab);
                if (!worker) {
                    response.contentType = "text/plain; charset=utf-8";
                    response.end("WROKED?");
                    return;
                }

_response++;
var r = response;
_responses["_"+_response] = r;

                worker.port.emit("getEpubFileText", {path: path, response: _response});

                return;
            } else if (/^[0-9]/.test(path.charAt(0))) { // EPUB package data!
                console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% EPUB: " + path);

                var worker = getWorker(tabs.activeTab);
                if (!worker) {
console.log("WROKED? ??? !");
                    response.contentType = "text/plain; charset=utf-8";
                    response.end("WROKED? ??? !");
                    return;
                }

                var isTXT = path.indexOf(".xml") >= 0 || path.indexOf(".html") >= 0 || path.indexOf(".xhtml") >= 0 || path.indexOf(".css") >= 0 || path.indexOf(".txt") >= 0 || path.indexOf(".opf") >= 0 || path.indexOf(".ncx") >= 0 || path.indexOf(".json") >= 0 || path.indexOf(".js") >= 0;
console.log("isTXT: "+isTXT);

_response++;
var r = response;
_responses["_"+_response] = r;

                if (isTXT) {
                    worker.port.emit("getEpubFileText", {path: path, response: _response});
                    return;
                } else {
                    worker.port.emit("getEpubFileBinary",  {path: path, response: _response});
                    return;
                }
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
    contentScript: 'self.port.on("getEpubFileText", function(raw) { var path = raw.path; var response = raw.response; '
    //
    + 'console.log("^^^^^^^ " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));'
    //  TODO: document.defaultView.postMessage('blabla', '*');
    //window.addEventListener("message", function(event) { ... }, false);
    + 'unsafeWindow.ReadiumStaticStorageManager.readFile(path, "Text", function(src){console.log("_SUCCESS TXT_"); self.port.emit("gotEpubFileText", { src: src, response: response }); }, function(data){console.log("_ERROR TXT_"); console.log(data); self.port.emit("gotEpubFileText", { src: "{}", response: response }); });'
    //
    + '});'
    //
    + 'self.port.on("getEpubFileBinary", function(raw) { var path = raw.path; var response = raw.response; '
    //
    + 'console.log("^^^^^^^ " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));'
    //
    + 'unsafeWindow.ReadiumStaticStorageManager.readFile(path, "ArrayBuffer", function(src){console.log("_SUCCESS_"); self.port.emit("gotEpubFileBinary", { src: src, response: response }); }, function(data){console.log("_ERROR_"); console.log(data); self.port.emit("gotEpubFileBinary", { src: "{}", response: response }); });'
    //
    + '});',

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
            console.log("|||||||||||||||| onAttach() !worker.port ??");
            return;
        }

        worker.port.on('detach', function() {
            detachWorker(this);
        });

        worker.port.on("gotEpubFileText", function(raw) {

            var src = raw.src;
            var response = _responses["_"+raw.response];
            delete _responses["_"+raw.response];
            
            
            var bytes = encodeURI(src).split(/%..|./).length - 1;
            // var m = encodeURIComponent(src).match(/%[89ABab]/g);
            // bytes = src.length + (m ? m.length : 0);

            response.contentType = "text/plain; charset=utf-8";

            response.contentLength = bytes;

            response.end(src);

            console.log('}}}}}}}}}}}}}}} RESPONSE TEXT: ', JSON.stringify(response, '', '  '));
        });

        worker.port.on("gotEpubFileBinary", function(raw) {

            var src = raw.src;
            var response = _responses["_"+raw.response];
            delete _responses["_"+raw.response];
        
            var bytes = src.byteLength;

            response.contentLength = bytes;

            response.end(src);

            console.log('}}}}}}}}}}}}}}} RESPONSE BINARY: ', JSON.stringify(response, '', '  '));
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
