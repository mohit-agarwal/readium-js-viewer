'use strict';

var rootDir = module.id.substr(0, module.id.lastIndexOf('/') + 1);
console.log('MODUlE DIR: ' + rootDir);

// var self = require('self') // Simulator
// var self = new function Self() {
//         const dataDir = rootDir + 'data/';
//         this.data = {
//             url: function(path) {
//                 return rootDir + path;
//             }
//         }
//     };
var self = require("sdk/self");

var readiumURL = self.data.url("index.html");
console.log(readiumURL); //resource://jid1-o4gyqlfagd1yhq-at-jetpack/readium/data/index.html


var URI_SCHEME = "readium";

//resource:readium or resource://readium/
//require('resource').set('readium', "http://daisy.org");
require('resource').set('readium', readiumURL);
//require('resource').set('readium', URI_SCHEME + "://" + rootDir + "index.html"); //  ==> resource://readium/ redirect (URL bar remains same)
//resource://readium/?epub=filesystemz%3A///1396002214784610


const timers = require('sdk/timers');
const protocol = require('./jetpack-protocol/index');

//protocol.about('downloads' ===> require('tabs').open('about:downloads')
exports.handler = protocol.protocol(URI_SCHEME, {
    isAbsolute: function(uri) {
console.log("handler.protocol.filesystem - isAbsolute: " + uri);

        return uri.indexOf(URI_SCHEME + ':') === 0
    },
//     onResolve: function(relative, base) {
// console.log("handler.protocol.filesystem - onResolve: " + relative + " $$ " + base);
// 
// if (this.isAbsolute(relative))
// {
//     console.debug("abs: "+ relative);
//     return relative;
// }
// else
// {
//     var full = base + relative;
//     console.debug("rel: "+ full);
//     return full;
// }
//     },
    onRequest: function(request, response) {
console.log("handler.protocol.filesystem - onRequest");
console.log('>>>', JSON.stringify(request, '', '  '));

var str = URI_SCHEME + "://" + rootDir;

 // ensure non-empty domain (replace with rootDir)
var requesturi = request.uri;
if (requesturi.replace(/\//g, '') === "readium:")
{
    console.log("READIUM URI root: " + requesturi);
    requesturi = str;
    
    response.uri = requesturi;
    return;
}
else
{
    var token = URI_SCHEME + ":///";
    if (requesturi.indexOf(token) === 0)
    {
        console.log("READIUM URI path: " + requesturi);
    
        requesturi = requesturi.replace(token, str);
    
        response.uri = requesturi;
        return;
    }
}


var index = requesturi.indexOf(str);
if (index === 0)
{
    //readium://readium/images/library_arrow.png?test=daniel#id
    //readium://readium/index.html?test=daniel#id
    //readium://readium/?test=daniel#id
    
    
console.log("============= redirect READIUM core data");
var path = requesturi.substr(str.length);
console.log("PATH: " + path);

if (path === "epub_library.json")
{
console.log("????? epub_library");
    response.contentType = "application/json; charset=utf-8";
    response.end('{}');
    return;
}
else if (/^[0-9]/.test(path.charAt(0)))
{
    //EPUB UUID
    var src = '<?xml version="1.0" encoding="UTF-8"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>';
//<?xml version="1.0" encoding="UTF-8"?><container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0"><rootfiles><rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/></rootfiles></container>
    var bytes = encodeURI(src).split(/%..|./).length - 1;
    // var m = encodeURIComponent(src).match(/%[89ABab]/g);
    // bytes = src.length + (m ? m.length : 0);
    
    
    //fetchFileContentsText, jQuery $.ajax() with dataType='text' !!
    //https://api.jquery.com/jQuery.ajax/
    //response.contentType = "application/xml; charset=utf-8";
    response.contentType = "text/plain; charset=utf-8";
    //response.contentType = "text";

    response.contentLength = bytes;
    
    response.end(src);
    
    //         timers.setTimeout(function() {
    // console.log("XML RESPONSE END");
    // response.end("\n");
    //         }, 1000);
    
console.log('}}}}}}}}}}}}}}} ', JSON.stringify(response, '', '  '));

return;
}


var query = path.indexOf('?');
if (query >= 0)
{
console.log("QUERY: " + query);
    var l = query;

    query = path.substr(query);
console.log("QUERY 2: " + query);
    path = path.substr(0, l);
console.log("PATH 2: " + path);
}
else
{
    query = "";
}
var url = self.data.url("index.html");
if (path && path.length > 0)
{
    var hash = path.indexOf('#');
    if (hash >= 0)
    {
console.log("HASH: " + hash);
    var ll = hash;
        hash = path.substr(hash);
console.log("HASH 2: " + hash);
        path = path.substr(0, ll);
console.log("PATH 3: " + path);
    }
    else
    {
        hash = "";
    }
    
    url = self.data.url(path) + hash;
}
url = url + query;
console.log("****** URL: " + url);
    response.uri = url;
    return;
        
}

response.uri = "http://daisy.org";
return;
        


    // response.contentType = "text/html";
    // response.write('Hello ');
    // response.write('<h1>Jedi is an awsome dude with a lightsaber!!</h1>');
    // response.end('World !');


    }
});

console.log("handler.register");
exports.handler.register();
// exports.handler.unregister()

var widgets = require("sdk/widget");
var widget = widgets.Widget({
    id: "readium",
    label: "Readium EPUB reader",
    contentURL: self.data.url("images/readium_favicon.png"),
    onClick: function() {
        //var url = URI_SCHEME + "://" + rootDir + "index.html";
        //var url = self.data.url("index.html");
        //var url = "resource://readium";
        var url = URI_SCHEME + "://" + rootDir + "index.html";
        var tabs = require("sdk/tabs");
        tabs.open(url);
    }
});
