'use strict';

function fileHasExtension(uri, ext) {
    var query = uri.indexOf('?');
    if (query >= 0) {
        uri = uri.substr(0, query); // excludes # hash fragment as well
    }

    var i = uri.indexOf(ext);
    return i >= 0 && i === (uri.length - ext.length);
}

function isText(uri) {
    return fileHasExtension(uri, ".xml") || fileHasExtension(uri, ".html") || fileHasExtension(uri, ".xhtml") || fileHasExtension(uri, ".css") || fileHasExtension(uri, ".txt") || fileHasExtension(uri, ".opf") || fileHasExtension(uri, ".ncx") || fileHasExtension(uri, ".json") || fileHasExtension(uri, ".js") || fileHasExtension(uri, ".smil");
};
exports.isText = isText;

function getMimeType(uri) {
    var txt = isText(uri);
    var mime = txt ? "text/plain" : "application/octet-stream";

    if (fileHasExtension(uri, ".js")) mime = "application/javascript";
    if (fileHasExtension(uri, ".json")) mime = "application/json";

    if (fileHasExtension(uri, ".xml")) mime = "application/xml";

    if (fileHasExtension(uri, ".css")) mime = "text/css";

    if (fileHasExtension(uri, ".opf")) mime = "application/oebps-package+xml";
    if (fileHasExtension(uri, ".ncx")) mime = "application/x-dtbncx+xml";

    if (fileHasExtension(uri, ".html")) mime = "application/xhtml+xml"; // "text/html"
    if (fileHasExtension(uri, ".xhtml")) mime = "application/xhtml+xml";

    if (fileHasExtension(uri, ".smil")) mime = "application/smil+xml";

    if (fileHasExtension(uri, ".txt")) mime = "text/plain";

    if (fileHasExtension(uri, ".jpg")) mime = "image/jpeg";
    if (fileHasExtension(uri, ".jpeg")) mime = "image/jpeg";
    if (fileHasExtension(uri, ".gif")) mime = "image/gif";
    if (fileHasExtension(uri, ".png")) mime = "image/png";


    if (fileHasExtension(uri, ".woff")) mime = "application/x-font-woff";
    if (fileHasExtension(uri, ".ttf")) mime = "font/ttf";

    mime = mime + (txt ? "; charset=utf-8" : "");
    
    //console.log("MIME TYPE (" + mime + "): " + uri);
    return mime;
}
exports.get = getMimeType;
