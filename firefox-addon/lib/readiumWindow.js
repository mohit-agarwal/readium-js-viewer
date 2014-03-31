const windows = require("sdk/windows");
const windowUtils = require("sdk/window/utils");

function getReadiumWindow() {

    //var win1 = windows.browserWindows.activeWindow;
    //var win2 = windowUtils.getMostRecentBrowserWindow().content;

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

    return win;
};
exports.get = getReadiumWindow;

function consoleLog(msg, win) {
    console.log(msg);

    if (!win) {
        win = getReadiumWindow();
        if (!win) {
            console.log("(no Readium window for console.log() postMessage)");
            return;
        }
    }

    win.postMessage({
        type: "READIUM_consoleLog",
        msg: JSON.stringify(msg, '', '  ')
    }, win.wrappedJSObject.READIUM_crossDomainFilter);
}
exports.consoleLog = consoleLog;
