'use strict';

// TODO: remove address bar?
//const addonpage = require("sdk/addon-page");

// TODO: redirect console?
// const cons = require("console/plain-text");
// const console = PlainTextConsole();

const windows = require("sdk/windows");
const windowUtils = require("sdk/window/utils");
const tabs = require("sdk/tabs");
const timers = require('sdk/timers');
const widgets = require("sdk/widget");
const pageMod = require("sdk/page-mod");
const self = require("sdk/self");

const URI_SCHEME = self.name; //"readium"
const URI_DOMAIN = URI_SCHEME;
//const URI_DOMAIN = module.id.substr(0, module.id.lastIndexOf('/') + 1);

//resource://jid1-o4gyqlfagd1yhq-at-jetpack/readium/data/index.html
//resource://{{self.id}}/{{self.name}}/data/index.html
const URI_INDEX_RESOURCE = self.data.url("index.html");
const URI_INDEX_READIUM = URI_SCHEME + "://" + URI_DOMAIN; // + "/index.html";

//resource:readium or resource://readium/
require('resource').set(URI_SCHEME, URI_INDEX_READIUM);


if (false) { //Firefox > 28
    // TODO: 
    // //https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/ui_button_action
    // var {
    //     ActionButton
    // } = require("sdk/ui/button/action");
    // var button = ActionButton({
    //     id: URI_SCHEME,
    //     label: "Readium, EPUB reader",
    //     icon: {
    //         "16": "images/readium_favicon.png",
    //         "32": "icons/readium_logo_48.png"
    //     },
    //     onClick: function(state) {
    //         var url = URI_SCHEME + "://" + URI_DOMAIN + "/";
    //         tabs.open(url);
    //     }
    // });
} else {

    const {
        Cc, Ci
    } = require("chrome");

    const windowMediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);

    var removeToolbarButton_document = function(xulDocument) {

        if (!xulDocument) return;

        var btn = xulDocument.getElementById(URI_SCHEME + '-button');
        if (btn) {
            btn.parentNode.removeChild(btn);
            // var navBar = xulDocument.getElementById('nav-bar');
            // if (navBar) {
            //     navBar.removeChild(btn);
            // }
        }
    };

    var removeToolbarButton_window = function(win) {

        if (!win) return;

        removeToolbarButton_document(win.document);
    };

    var removeToolbarButton_windows = function() {

        var enumerator = windowMediator.getEnumerator("navigator:browser");
        while (enumerator.hasMoreElements()) {
            removeToolbarButton_window(enumerator.getNext());
        }
    };

    exports.onUnload = function(reason) {
        removeToolbarButton_windows();
    };

    var addToolbarButton = function(win) {

        if (!win) return;

        var xulDocument = win.document;
        if (!xulDocument) return;

        var navBar = xulDocument.getElementById("nav-bar");
        if (!navBar) return;

        var btn = xulDocument.getElementById(URI_SCHEME + '-button');
        if (btn) {
            btn.parentNode.removeChild(btn);
        }

        btn = xulDocument.createElement("toolbarbutton");

        btn.setAttribute('id', URI_SCHEME + '-button');
        btn.setAttribute('type', 'button');
        btn.setAttribute('class', 'toolbarbutton-1');
        btn.setAttribute('image', self.data.url("images/readium_favicon.png")); // path is relative to data folder
        btn.setAttribute('orient', 'horizontal');
        btn.setAttribute('label', 'Readium, EPUB reader');

        btn.addEventListener('click',
            function() {
                var url = URI_SCHEME + "://" + URI_DOMAIN + "/";
                tabs.open(url);
            }, false);

        navBar.appendChild(btn);
    };

    var ensureToolBarButton = function(win) {
        removeToolbarButton_window(win);
        addToolbarButton(win);
    };

    windows.browserWindows.on('open', function(win) {

        //win = windowMediator.getMostRecentWindow('navigator:browser');
        win = windowUtils.getMostRecentBrowserWindow();

        ensureToolBarButton(win);
    });

    timers.setTimeout(function() {
        var win = windowUtils.getMostRecentBrowserWindow();
        ensureToolBarButton(win);
    }, 1000);
}

var widget = widgets.Widget({
    id: URI_SCHEME + "-widget",
    label: "Readium, EPUB reader",
    contentURL: self.data.url("images/readium_favicon.png"),
    onClick: function() {
        //var url = self.data.url("index.html");
        //var url = "resource://" + URI_DOMAIN + "/";
        //var url = URI_SCHEME + "://" + URI_DOMAIN + "/index.html";
        var url = URI_SCHEME + "://" + URI_DOMAIN + "/";
        tabs.open(url);
    }
});















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
        if (_workers[i].tab === tab) {
            var winn = windowUtils.getMostRecentBrowserWindow().content;
            if (_workers[i].win !== winn) {
                console.log("?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????? WINDOW DIFF");
            }
            return _workers[i];
        }
    }
    return undefined;
}

var _responses = {};
var _response = -1;

const protocol = require('./jetpack-protocol/index');
exports.handler = protocol.protocol(URI_SCHEME, {
    isAbsolute: function(uri) {
        return uri.indexOf(URI_SCHEME + ':') === 0
    },
    onRequest: function(request, response) {
        console.log('>>>>>>>>>> REQUEST: ', JSON.stringify(request, '', '  '));

        var str = URI_SCHEME + "://" + URI_DOMAIN + "/";

        var token = URI_SCHEME + ":///";

        // ensure non-empty domain (replace with URI_DOMAIN)
        var requesturi = request.uri;
        if (requesturi.replace(/\//g, '') === URI_SCHEME + ":") {
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

                    worker.port.emit("READIUM_getEpubFileText", {
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
                        worker.port.emit("READIUM_getEpubFileText", {
                            path: path,
                            response: _response
                        });

                    } else {
                        worker.port.emit("READIUM_getEpubFileBinary", {
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


const mimeTypes = require('mimeTypes');

var inject = {
    contentScriptWhen: 'ready',
    include: URI_SCHEME + "://" + URI_DOMAIN + "/*",

    contentScriptFile: self.data.url("contentScript.js"),
    //contentScript: '',

    onAttach: function(worker) {

        var win = windowUtils.getMostRecentBrowserWindow().content;
        //if (!win.ReadiumStaticStorageManager) return;

        worker.win = win;

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

        worker.port.on("READIUM_gotEpubFileText", function(raw) {

            var src = raw.fileContent;

            console.log(raw.path);

            var response = _responses["_" + raw.response];
            delete _responses["_" + raw.response];

            console.log("raw.response: " + raw.response);

            var bytes = src ? (encodeURI(src).split(/%..|./).length - 1) : 0;
            // var m = encodeURIComponent(src).match(/%[89ABab]/g);
            // bytes = src.length + (m ? m.length : 0);

            var mime = mimeTypes.get(response.uri, true);
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
            if (raw.type !== "READIUM_gotEpubFileBinary") return;


            var src = raw.fileContent;

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

            var mime = mimeTypes.get(response.uri);
            response.contentType = mime;

            response.contentLength = bytes;

            response.writeBinary(src);
            response.end();

            console.log('}}}}}}}}}}}}}}} RESPONSE BINARY: ', JSON.stringify(response, '', '  '));
        };

        // worker.on("message", messageProc);
        // 
        // worker.on("message", function(data)
        // {
        //     console.log("message");
        // });
        // 
        // worker.onmessage = function(e) {
        //     
        //     console.log('onmessage');
        // 
        //     // var raw = e.data;
        //     // 
        //     // messageProc(raw);
        // };

        //console.log(windowUtils.getMostRecentBrowserWindow().content.document.documentElement.outerHTML);

        win.addEventListener("message", function(e) {

            console.log('..............................addEventListener "message"   ' + e.data);

            if (!e.data.type) return;

            var raw = e.data;
            messageProc(raw);

        }, false);
        // 
        //         //var gBrowser = windowUtils.getMostRecentBrowserWindow().getBrowser();
        //         windowUtils.getMostRecentBrowserWindow().content.addEventListener("message", function(e) {
        //             
        //             console.log('addEventListener "message"');
        //                         // 
        //             // var raw = e.data;
        //             // 
        //             // messageProc(raw);
        //         }, false);
        //         
        //         for each (let window in windowUtils.windows()) {
        // console.log("......................addEventListener ...");
        //             window.content.addEventListener("message", function(e) {
        //                 
        //                 console.log('addEventListener "message"');
        //                             // 
        //                 // var raw = e.data;
        //                 // 
        //                 // messageProc(raw);
        //             }, false);
        //         }
        //         
        //         
        //         var win = windowUtils.getFocusedWindow();
        //         win.content.addEventListener("message", function(e) {
        //                 
        //                 console.log('addEventListener "message"');
        //                             // 
        //                 // var raw = e.data;
        //                 // 
        //                 // messageProc(raw);
        //             }, false);
        // console.log("......................addEventListener ...3");
    }
};

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

//pageMod.PageMod(inject);
