'use strict';

function fileHasExtension(path, ext) {
    var query = path.indexOf('?');
    if (query >= 0) {
        path = path.substr(0, query); // excludes # hash fragment as well
    }

    var i = path.indexOf(ext);
    return i >= 0 && i === (path.length - ext.length);
}

function getMimeType(uri, isText) {
    var mime = isText ? "text/plain" : "application/octet-stream";

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

    console.log("DEFAULT MIME TYPE (" + mime + "): " + uri);
    return mime + (isText ? "; charset=utf-8" : "");
}
exports.get = getMimeType;
