require.config({

    config: {
        'workers/WorkerProxy': {
            'workerUrl': './scripts/readium-worker.js'
        },
        'EpubLibraryManager': {
            'canHandleUrl': true,
            'canHandleDirectory': false //TODO: see EpubLibraryManager.handleDirectoryImport, only File.mozFullPath is supported => no directory file chooser, no full-folder import :(
        },
        'EpubReader': {
            'annotationCssUrl': self.location.origin + '/css/annotations.css'
        }
    }
});
