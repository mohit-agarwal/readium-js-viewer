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
const self = require("sdk/self");

const URI_SCHEME = self.name; //"readium"
const URI_DOMAIN = URI_SCHEME;
//const URI_DOMAIN = module.id.substr(0, module.id.lastIndexOf('/') + 1);

//resource://jid1-o4gyqlfagd1yhq-at-jetpack/readium/data/index.html
//resource://{{self.id}}/{{self.name}}/data/index.html
const URI_INDEX_READIUM = URI_SCHEME + "://" + URI_DOMAIN + "/"; // trailing slash is important!
const URI_EPUB_READIUM = URI_SCHEME + "://epub/"; // trailing slash is important!
//const URI_INDEX_RESOURCE = self.data.url("index.html");

//window.READIUM_crossDomainFilter
//const crossDomainFilter = URI_SCHEME + "://" + URI_DOMAIN;

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
                openReadium();
            }, false);

        navBar.appendChild(btn);
    };

    var ensureToolBarButton_window = function(win) {
        removeToolbarButton_window(win);
        addToolbarButton(win);
    };

    var ensureToolBarButton = function() {

        //var win = windowMediator.getMostRecentWindow('navigator:browser');
        var win = windowUtils.getMostRecentBrowserWindow();

        ensureToolBarButton_window(win);
    };

    windows.browserWindows.on('open', ensureToolBarButton);

    timers.setTimeout(ensureToolBarButton, 1000);
}

var widget = widgets.Widget({
    id: URI_SCHEME + "-widget",
    label: "Readium, EPUB reader",
    contentURL: self.data.url("images/readium_favicon.png"),
    onClick: function() {
        openReadium();
    }
});

//resource:readium or resource://readium/
require('resource').set(URI_SCHEME, self.data.url("index.html"));
//require('resource').set(URI_SCHEME, URI_INDEX_READIUM + "index.html");

var openReadium = function() {
    //var url = self.data.url("index.html");
    //var url = "resource://" + URI_SCHEME;
    var url = URI_SCHEME + "://" + URI_DOMAIN + "/";

    tabs.open(url);
};

tabs.on('open', function(tab) {
    // console.log("~~~ TAB OPEN: " + tab.window); // BrowserWindow
    tab.on('ready', tabReady);
});

var tabReady = function(tab) {
    var win = windowUtils.getMostRecentBrowserWindow().content;

    // console.log("~~~ TAB READY: " + win); //XrayWrapper Window
    // console.log(win.wrappedJSObject.READIUM_ROOT_INDEX);
    // console.log(win.document.documentElement.outerHTML);
    if (win.wrappedJSObject && win.wrappedJSObject.READIUM_ROOT_INDEX) {
        setupContentBridge(win);
    }
};

if (tabs.activeTab) {
    tabs.activeTab.on('ready', tabReady);
}

const mimeTypes = require('mimeTypes');

var gotFileContent = function(payload) {

    var binary = payload.type === "READIUM_gotEpubFileBinary";

    if (!binary && payload.type !== "READIUM_gotEpubFileText") return;

    var response = _responses["_" + payload.response];
    delete _responses["_" + payload.response];

    response.contentType = mimeTypes.get(response.uri);

    var fileContent = payload.fileContent;

    if (binary) {

        fileContent = new Uint8Array(fileContent);

        response.contentLength = fileContent.byteLength;

        response.writeBinary(fileContent);
        response.end();

    } else { // "READIUM_gotEpubFileText"
        // var m = encodeURIComponent(fileContent).match(/%[89ABab]/g);
        // bytes = fileContent.length + (m ? m.length : 0);
        response.contentLength = encodeURI(fileContent).split(/%..|./).length - 1;

        response.end(fileContent);
    }
};

var setupContentBridge = function(win) {
    console.log("``````````` READIUM WIRE");
    win.addEventListener("message",
        function(e) {
            var payload = e.data;
            if (!payload || !payload.type) return;

            if (payload.type === "PING") {
                console.log("<<<<<<<<< PONG: " + payload.msg);
                return;
            }

            gotFileContent(payload);
        }, false);
};





var _responses = {};
var _response = -1;

const protocol = require('./jetpack-protocol/index');
exports.handler = protocol.protocol(URI_SCHEME, {
    isAbsolute: function(uri) {
        return uri.indexOf(URI_SCHEME + ':') === 0
    },
    onRequest: function(request, response) {
        //console.log('>>>>>>>>>> REQUEST: ', JSON.stringify(request, '', '  '));

        // ensure non-empty domain (adds URI_DOMAIN if missing, and redirects URI request)
        if (response.uri.replace(/\//g, '') === URI_SCHEME + ":") {
            response.uri = URI_INDEX_READIUM;
            console.log("URI: " + response.uri);
            return;
        }
        var emptyDomain = URI_SCHEME + ":///";
        if (response.uri.indexOf(emptyDomain) === 0) {
            response.uri = URI_INDEX_READIUM + response.uri.substr(emptyDomain.length);
            console.log("URI: " + response.uri);
            return;
        }

        var isReadiumCore = request.uri.indexOf(URI_INDEX_READIUM) === 0;
        var isReadiumEpub = request.uri.indexOf(URI_EPUB_READIUM) === 0;

        if (!URI_INDEX_READIUM && !URI_EPUB_READIUM) {
            console.log(">>>>>>>>>> Invalid Readium URI request?!");

            response.contentType = "text/html";
            response.write('<h1>Not READIUM?!</h1>');
            response.end('<br>');
            return;
        }

        var path = isReadiumCore ? request.uri.substr(URI_INDEX_READIUM.length) : request.uri.substr(URI_EPUB_READIUM.length);

        var isJSONLib = path === "epub_library.json";
        var isEPUBData = isReadiumEpub || !isJSONLib && /^[0-9]/.test(path.charAt(0));

        if (isJSONLib || isEPUBData) {

            // var win1 = windows.browserWindows.activeWindow;
            //var win = windowUtils.getMostRecentBrowserWindow().content;

            var win = null;
            //for each (var w in windows.browserWindows) {
            for each(var w in windowUtils.windows()) {
                if (w.content) w = w.content;

                // any will do, all instances have access to the same indexedDB filesystem
                if (w && w.wrappedJSObject && w.wrappedJSObject.READIUM_ROOT_INDEX) {
                    win = w;
                    break;
                }
            }

            if (!win || !win.wrappedJSObject || !win.wrappedJSObject.READIUM_ROOT_INDEX) {
                console.log(">>>>>>>>>> No Readium WINDOW: " + request.uri);
                response.end();
                return;
            }

            if (isJSONLib) {

                _response++;
                var r = response;
                _responses["_" + _response] = r;

                var post = function(ir) {
                    win.postMessage({
                        type: "READIUM_getEpubFileText",
                        path: path,
                        response: ir
                    }, win.wrappedJSObject.READIUM_crossDomainFilter);
                };
                var ir = _response;
                try {
                    post(ir);
                } catch (e) {
                    console.log("TOO EARLY?");
                    timers.setTimeout(function() {
                        post(ir);
                    }, 500);
                }

            } else if (isEPUBData) {

                _response++;
                var r = response;
                _responses["_" + _response] = r;

                if (mimeTypes.isText(path)) {
                    win.postMessage({
                        type: "READIUM_getEpubFileText",
                        path: path,
                        response: _response
                    }, win.wrappedJSObject.READIUM_crossDomainFilter);
                } else {
                    win.postMessage({
                        type: "READIUM_getEpubFileBinary",
                        path: path,
                        response: _response
                    }, win.wrappedJSObject.READIUM_crossDomainFilter);
                }
            }

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
        //console.log("query: " + query);
        var hash = query.indexOf('#');
        if (hash >= 0) {
            var ll = hash;
            hash = query.substr(hash);
            query = query.substr(0, ll);
        } else {
            hash = "";
        }
        //console.log("hash: " + hash);
        var url = self.data.url("index.html");
        if (path.length > 0) {
            url = self.data.url(path);
        }
        url = url + query + hash;

        response.uri = url;

        //console.log("URI: " + response.uri);
        
        //readium://readium/?epub=readium%3A%2F%2Freadium%2F1396248306523121
        //readium://readium/?epub=readium://readium/1396248306523121
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
