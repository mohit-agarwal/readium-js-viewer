'use strict';

if (unsafeWindow && unsafeWindow.ReadiumStaticStorageManager) {

    //unsafeWindow  ... window.wrappedJSObject

    //console.log(unsafeWindow.document.documentElement.outerHTML);

    setTimeout(function() {
        console.log("postMessage test (ping + pong)");
        unsafeWindow.postMessage("ping", "*");
        unsafeWindow.postMessage("pong", "readium://readium");
    }, 1500);

    self.port.on("READIUM_getEpubFileText",
        function(payload) {
            var path = payload.path;
            var response = payload.response;

            unsafeWindow.ReadiumStaticStorageManager.readFile(path, "Text",

                function(fileContent) {
                    self.port.emit("READIUM_gotEpubFileText", {
                        fileContent: fileContent,
                        response: response,
                        path: path
                    });
                },
                function(data) {
                    console.log("READIUM_gotEpubFileText ERROR: " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));
                    console.log(data);

                    self.port.emit("READIUM_gotEpubFileText", {
                        fileContent: undefined,
                        response: response,
                        path: path
                    });
                });
        });

    self.port.on("READIUM_getEpubFileBinary",
        function(payload) {
            var path = payload.path;
            var response = payload.response;

            unsafeWindow.ReadiumStaticStorageManager.readFile(path, "ArrayBuffer",

                function(fileContent) {

                    var payback = {
                        type: "READIUM_gotEpubFileBinary",
                        fileContent: fileContent, // ArrayBuffer
                        response: response,
                        path: path
                    };

                    //"readium://readium"
                    unsafeWindow.postMessage(payback, "*", [payback.fileContent]);
                    // fast transferable ArrayBuffer, no structured copy

                    // document.defaultView.postMessage()
                    // self.port.emit()
                },
                function(data) {
                    console.log("READIUM_gotEpubFileBinary ERROR: " + unsafeWindow.ReadiumStaticStorageManager.getPathUrl(path));
                    console.log(data);

                    self.postMessage({
                        type: "READIUM_gotEpubFileBinary",
                        fileContent: undefined,
                        response: response,
                        path: path
                    });
                });
        });
}
