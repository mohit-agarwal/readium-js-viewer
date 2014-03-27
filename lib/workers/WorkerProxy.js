define(['module', 'workers/Messages', 'jquery', 'PackageParser'], function(module, Messages, $, PackageParser){
	
	var worker;
	var cleanupWorker = function(){
		worker.terminate();
		worker = null;
	}
	var doWork = function(data, callbacks){
		if (worker){
			console.log('dangling worker');
		}

		var workerUrl = module.config().workerUrl;
console.debug(workerUrl);
		worker = new Worker(workerUrl);

		var continueOverwrite = function(){
			worker.postMessage({msg: Messages.OVERWRITE_CONTINUE});
		}
		var keepBoth = function(){
			worker.postMessage({msg: Messages.OVERWRITE_SIDE_BY_SIDE})
		}
		var cancelOverwrite = function(){
			cleanupWorker();
		}
		
		var innerError = callbacks.error || $.noop;
		var error = function(error){
			cleanupWorker();
			innerError(error);
		}


		
		worker.onmessage = function(evt){
			var data = evt.data;
			switch (data.msg){
				case Messages.CONSOLE_LOG:
console.log("CONSOLE_LOG");
					if (data.log){
						console.log(data.log);
					}
					break;
				case Messages.SUCCESS:
console.log("SUCCESS");
// var object = $.extend({}, data);
// console.log(object);
					if (callbacks.success){
						callbacks.success(data.libraryItems ? data.libraryItems : data.library);
					}
					cleanupWorker();
					break;
				case Messages.PROGRESS:
console.log("PROGRESS");
					if (callbacks.progress){
						callbacks.progress(data.percent, data.progressType, data.progressData);
					}
					break;
				case Messages.OVERWRITE:
console.log("OVERWRITE");
					if (callbacks.overwrite){
						callbacks.overwrite(data.item, continueOverwrite, keepBoth, cancelOverwrite);
					}
					break;
				case Messages.FIND_PACKAGE: 
console.log("FIND_PACKAGE");
					var containerDom = (new DOMParser()).parseFromString(data.containerStr, "text/xml");
					var $rootfile = $('rootfile', containerDom);
					if (!$rootfile.length){
	                    error(Messages.ERROR_EPUB);
	                    console.error('Epub container.xml missing rootfile element');
	                }
	                else{
	                	worker.postMessage({msg: Messages.FIND_PACKAGE_RESPONSE, path: $rootfile.attr('full-path')});
	                }
					break;
				case Messages.PARSE_PACKAGE:
console.log("PARSE_PACKAGE");
					var packageDom = (new DOMParser()).parseFromString(data.packageStr, "text/xml");
					var packageObj = PackageParser.parsePackageDom(packageDom);
					worker.postMessage({msg: Messages.PARSE_PACKAGE_RESPONSE, packageObj: packageObj})
					break;
				default:
console.log("ERROR");
					error(data.errorMsg || "Unknown error");
					cleanupWorker();
			}
		}
		worker.onerror = function(){
			console.error(arguments)
		}
		currentWorker = worker;
console.log("doWork 1");
		worker.postMessage(data);
console.log("doWork 2");
	}

	return {
		importZip: function(blob, libraryItems, callbacks){
			doWork({msg: Messages.IMPORT_ZIP, buf: blob, libraryItems: libraryItems}, callbacks);
		},
		importDirectory : function(files, libraryItems, callbacks){
			doWork({msg: Messages.IMPORT_DIR, files: files, libraryItems: libraryItems}, callbacks);
		},
		importUrl : function(url, libraryItems, callbacks){
			doWork({msg: Messages.IMPORT_URL, url: url, libraryItems: libraryItems}, callbacks);
		},
		deleteEpub : function(id, libraryItems, callbacks){
			doWork({msg: Messages.DELETE_EPUB, id: id, libraryItems:libraryItems}, callbacks);
		},
		migrateOldBooks : function(callbacks){
			doWork({msg: Messages.MIGRATE}, callbacks);
		}
	}
});