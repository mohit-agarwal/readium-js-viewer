var widgets = require("sdk/widget");
var self = require("sdk/self");

var widget = widgets.Widget({
  id: "readium",
  label: "Readium EPUB reader",
  contentURL: self.data.url("images/readium_favicon.png"),
  onClick: function() {
      url= self.data.url("index.html");
      var tabs = require("sdk/tabs");
      tabs.open(url);
  }
});