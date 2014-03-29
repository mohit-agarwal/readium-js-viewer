'use strict';

const windows = require("sdk/windows");
const windowUtils = require("sdk/window/utils");

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

function getMimeType(uri, isText) {
    var mime = isText ? "text/plain" : "application/octet-stream";

    if (uri.indexOf(".js") > 0) mime = "application/javascript";
    if (uri.indexOf(".json") > 0) mime = "application/json";

    if (uri.indexOf(".xml") > 0) mime = "application/xml";

    if (uri.indexOf(".css") > 0) mime = "text/css";

    if (uri.indexOf(".opf") > 0) mime = "application/oebps-package+xml";
    if (uri.indexOf(".ncx") > 0) mime = "application/x-dtbncx+xml";

    if (uri.indexOf(".html") > 0) mime = "application/xhtml+xml"; // "text/html"
    if (uri.indexOf(".xhtml") > 0) mime = "application/xhtml+xml";

    if (uri.indexOf(".smil") > 0) mime = "application/smil+xml";

    if (uri.indexOf(".txt") > 0) mime = "text/plain";

    if (uri.indexOf(".jpg") > 0) mime = "image/jpeg";
    if (uri.indexOf(".jpeg") > 0) mime = "image/jpeg";
    if (uri.indexOf(".gif") > 0) mime = "image/gif";
    if (uri.indexOf(".png") > 0) mime = "image/png";

    return mime + (isText ? "; charset=utf-8" : "");
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
            console.log("URI 1");
            response.uri = requesturi;

            //injectWorker();
            return;
        } else if (requesturi.indexOf(token) === 0) {
            requesturi = requesturi.replace(token, str);
            console.log("URI 2");
            response.uri = requesturi;

            //injectWorker();
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

                injectWorker();
                timers.setTimeout(function() {
                    var worker = getWorker(tabs.activeTab);
                    if (!worker) {
                        console.log("NO WORKER?!?");
                        response.contentType = "text/plain; charset=utf-8";
                        response.end("Please use the Readium icon (Firefox's bottom-right corner)");
                        return;
                    }
                    _response++;
                    var r = response;
                    _responses["_" + _response] = r;

                    worker.port.emit("getEpubFileText", {
                        path: path,
                        response: _response
                    });
                }, 100);

                return;
            } else if (/^[0-9]/.test(path.charAt(0))) { // EPUB package data!
                console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% EPUB: " + path);

                var isTXT = path.indexOf(".xml") >= 0 || path.indexOf(".html") >= 0 || path.indexOf(".xhtml") >= 0 || path.indexOf(".css") >= 0 || path.indexOf(".txt") >= 0 || path.indexOf(".opf") >= 0 || path.indexOf(".ncx") >= 0 || path.indexOf(".json") >= 0 || path.indexOf(".js") >= 0 || path.indexOf(".smil") >= 0;
                console.log("isTXT: " + isTXT);

                injectWorker();
                timers.setTimeout(function() {
                    var worker = getWorker(tabs.activeTab);
                    if (!worker) {
                        console.log("NO WORKER?!?");
                        response.contentType = "text/plain; charset=utf-8";
                        response.end("Please use the Readium icon (Firefox's bottom-right corner)");
                        return;
                    }
                    _response++;
                    var r = response;
                    _responses["_" + _response] = r;

                    if (isTXT) {
                        worker.port.emit("getEpubFileText", {
                            path: path,
                            response: _response
                        });

                    } else {
                        worker.port.emit("getEpubFileBinary", {
                            path: path,
                            response: _response
                        });

                    }
                }, 100);

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
            console.log("query: " + query);
            var hash = query.indexOf('#');
            if (hash >= 0) {
                var ll = hash;
                hash = query.substr(hash);
                query = query.substr(0, ll);
            } else {
                hash = "";
            }
            console.log("hash: " + hash);
            var url = self.data.url("index.html");
            if (path.length > 0) {
                url = self.data.url(path);
            }
            url = url + query + hash;

            console.log("url: " + url);
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
    contentScript: ' /*  unsafeWindow   window.wrappedJSObject  */ self.port.on("getEpubFileText", function(raw) { var path = raw.path; var response = raw.response; '
    //
    + 'console.log("^^^^^^^ TXT " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));'
    //  TODO: document.defaultView.postMessage('blabla', '*');
    //window.addEventListener("message", function(event) { ... }, false);
    + 'unsafeWindow.ReadiumStaticStorageManager.readFile(path, "Text", function(src){console.log("_SUCCESS TXT_"); self.port.emit("gotEpubFileText", { src: src, response: response, path: path }); }, function(data){console.log("_ERROR TXT_"); console.log(data); self.port.emit("gotEpubFileText", { src: undefined, response: response, path: path }); });'
    //
    + '});'
    //
    + 'self.port.on("getEpubFileBinary", function(raw) { var path = raw.path; var response = raw.response; '
    //
    + 'console.log("^^^^^^^ BIN " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));'
    //
    + 'unsafeWindow.ReadiumStaticStorageManager.readFile(path, "ArrayBuffer", '
    //
    + 'function(data){console.log("_SUCCESS BIN_"); console.log(data.byteLength); var data_ = new Uint8Array(data); console.log(data_.byteLength); var obj = { type: "gotEpubFileBinary", src: data_, response: response, path: path }; /* document.defaultView.postMessage() self.port.emit() self.postMessage(SINGLE_PARAM) */ /* self.postMessage(obj, [obj.src.buffer]); console.log("after postMessage"); console.log(obj.src.byteLength); */ unsafeWindow.postMessage(obj, "*" /* "readium://readium" */, [obj.src.buffer]); console.log("after WIN postMessage"); console.log(obj.src.byteLength); }, '
    //
    + 'function(data){console.log("_ERROR BIN_"); console.log(data); self.postMessage({ type: "gotEpubFileBinary", src: undefined, response: response, path: path }); });'
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

            console.log(raw.path);

            var response = _responses["_" + raw.response];
            delete _responses["_" + raw.response];

            console.log("raw.response: " + raw.response);

            var bytes = src ? (encodeURI(src).split(/%..|./).length - 1) : 0;
            // var m = encodeURIComponent(src).match(/%[89ABab]/g);
            // bytes = src.length + (m ? m.length : 0);

            var mime = getMimeType(response.uri, true);
            response.contentType = mime;

            response.contentLength = bytes;

            response.end(src);

            if (response.uri.indexOf("epub_library.json") >= 0) {
                console.log(":::::::::::::: epub_library" + raw.path);
                console.log(src);
            }

            console.log('}}}}}}}}}}}}}}} RESPONSE TEXT: ', JSON.stringify(response, '', '  '));
        });

        var messageProc = function(raw) {
            console.log("message");
            console.log(raw.type);
            if (raw.type !== "gotEpubFileBinary") return;


            var src = raw.src;
            console.log(src.length);
            console.log(src.byteLength);
            src = new Uint8Array(src);

            console.log(raw.path);

            console.log(src.length);
            console.log(src.byteLength);

            //console.log(src);

            var response = _responses["_" + raw.response];
            delete _responses["_" + raw.response];

            console.log("raw.response: " + raw.response);

            var bytes = src ? src.byteLength : 0;

            console.log("TTTTT");
            console.log(src.byteLength);
            console.log(bytes);

            var mime = getMimeType(response.uri);
            response.contentType = mime;

            response.contentLength = bytes;

            response.end(src);

            console.log('}}}}}}}}}}}}}}} RESPONSE BINARY: ', JSON.stringify(response, '', '  '));
        };

        // worker.on("message", messageProc);
        
        worker.on("message", function(data)
        {
            console.log("message");
        });

        worker.onmessage = function(e) {
            
            console.log('onmessage');

            // var raw = e.data;
            // 
            // messageProc(raw);
        };

        //var gBrowser = windowUtils.getMostRecentBrowserWindow().getBrowser();
        windowUtils.getMostRecentBrowserWindow().content.addEventListener("message", function(e) {
            
            console.log('addEventListener "message"');
                        // 
            // var raw = e.data;
            // 
            // messageProc(raw);
        }, false);
        
        for each (let window in windowUtils.windows()) {
console.log("......................addEventListener ...");
            window.content.addEventListener("message", function(e) {
                
                console.log('addEventListener "message"');
                            // 
                // var raw = e.data;
                // 
                // messageProc(raw);
            }, false);
        }
        
        
        var win = windowUtils.getFocusedWindow();
        win.content.addEventListener("message", function(e) {
                
                console.log('addEventListener "message"');
                            // 
                // var raw = e.data;
                // 
                // messageProc(raw);
            }, false);
console.log("......................addEventListener ...3");
    }
};
            
        windows.browserWindows.on("open", domWindow => {
console.log("......................addEventListener ... 2");
            windowUtils.getMostRecentBrowserWindow().content.addEventListener("message", function(e) {
                
                console.log('addEventListener "message"');
                            // 
                // var raw = e.data;
                // 
                // messageProc(raw);
            }, false);
        });
        
var injectWorker = function() {
    var worker = getWorker(tabs.activeTab);
    if (!worker) {
        console.log("~~~~~~~~~~~~~~~~~~~ INJECT WORKER");

        var worker = tabs.activeTab.attach(inject);
        inject.onAttach(worker);
    }
    // timers.setTimeout(function() {
    //         console.log("TAB onAtttach");
    // 
    //         var worker = getWorker(tabs.activeTab);
    //         inject.onAttach(worker);
    // }, 100);
}

// pageMod.PageMod(inject);
var widget = widgets.Widget({
    id: "readium",
    label: "Readium EPUB reader",
    contentURL: self.data.url("images/readium_favicon.png"),
    onClick: function() {
        //var url = self.data.url("index.html");
        //var url = "resource://" + rootDir;
        //var url = URI_SCHEME + "://" + rootDir + "index.html";
        var url = URI_SCHEME + "://" + rootDir;

        tabs.open(url);
        // 
        // timers.setTimeout(function() {
        //     injectWorker();
        // }, 100);
    }
});
