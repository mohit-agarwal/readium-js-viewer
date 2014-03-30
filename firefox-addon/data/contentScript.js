'use strict';

var setupContentBridge = function() {

    console.log(">>>>>>>>>>>>>>>>>>>>> PING 3");
    window.postMessage({
        type: "PING",
        msg: "3) DOC READY"
    }, window.READIUM_crossDomainFilter);
    
    var unsafeWindow = window;

    var respondText = function(payload) {
        var path = payload.path;
        var response = payload.response;

        var payback = {
            type: "READIUM_gotEpubFileText",
            fileContent: null,
            response: response,
            path: path
        };

        unsafeWindow.ReadiumStaticStorageManager.readFile(path, "Text",

            function(fileContent) {
                payback.fileContent = fileContent;
                unsafeWindow.postMessage(payback, window.READIUM_crossDomainFilter);
            },
            function(data) {
                console.log(payback.type + " ERROR: " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));
                console.log(data);

                unsafeWindow.postMessage(payback, window.READIUM_crossDomainFilter);
            });
    };

    var respondBinary = function(payload) {
        var path = payload.path;
        var response = payload.response;

        var payback = {
            type: "READIUM_gotEpubFileBinary",
            fileContent: null,
            response: response,
            path: path
        };

        unsafeWindow.ReadiumStaticStorageManager.readFile(path, "ArrayBuffer",

            function(fileContent) {
                payback.fileContent = fileContent; // ArrayBuffer

                unsafeWindow.postMessage(payback, window.READIUM_crossDomainFilter, [payback.fileContent]);
                // fast transferable ArrayBuffer, no structured copy

                // document.defaultView.postMessage()
                // self.port.emit()
                // self.postMessage
            },
            function(data) {
                console.log(payback.type + " ERROR: " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));
                console.log(data);

                unsafeWindow.postMessage(payback, window.READIUM_crossDomainFilter);
            });
    };

    unsafeWindow.addEventListener("message",
        function(e) {
            var payload = e.data;
            if (!payload || !payload.type) return;

            if (payload.type === "READIUM_getEpubFileText") {
                respondText(payload);
            } else if (payload.type === "READIUM_getEpubFileBinary") {
                respondBinary(payload);
            }
        }, false);

    // self.port.on("READIUM_getEpubFileText",
    //     function(payload) {
    //         respondText(payload);
    //     });
    // 
    // self.port.on("READIUM_getEpubFileBinary",
    //     function(payload) {
    //         respondBinary(payload);
    //     });
}

document.addEventListener("DOMContentLoaded", setupContentBridge, false);
//setupContentBridge();


// if (unsafeWindow && unsafeWindow.ReadiumStaticStorageManager && !unsafeWindow.contentScriptWasInjected) {
// 
//     unsafeWindow.contentScriptWasInjected = true;
//     
//     //unsafeWindow  ... window.wrappedJSObject
// 
//     //console.log(unsafeWindow.document.documentElement.outerHTML);
// }
