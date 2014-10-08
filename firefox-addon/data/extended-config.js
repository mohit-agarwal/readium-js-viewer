require.config({

    config: {
        'workers/WorkerProxy': {
            'workerUrl': './scripts/readium-worker.js'
        },
        'EpubLibraryManager': {
            'canHandleUrl': false,
            'canHandleDirectory': false //TODO: see EpubLibraryManager.handleDirectoryImport, only File.mozFullPath is supported => no directory file chooser, no full-folder import :(
        },
        'EpubReader': {
            'annotationCssUrl': 'readium://readium/css/annotations.css',
            'useSimpleLoader' : true
        }
    }
});
