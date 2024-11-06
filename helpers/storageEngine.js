var fs = require('fs')

function getDestination(req, file, cb) {
    cb(null, 'uploads/')
}

class CustomStorageEngine {
    constructor(opts) {
        this.getDestination = (opts.destination || getDestination)
    }
    _handleFile(req, file, cb) {
        this.getDestination(req, file, async function (err, path) {
            if (err) return cb(err)
            var outStream = fs.createWriteStream(path + "/" + file.originalname)
            var uploadsStream = fs.createWriteStream("uploads/" + file.originalname)
            let streamStatus = { outStream: 0, uploadStream: 0 }
            file.stream.pipe(outStream)
            file.stream.pipe(uploadsStream)
            outStream.on('error', cb)
            uploadsStream.on('error', cb)
            outStream.on('finish', function () {
                if (streamStatus.uploadStream == 1) {
                    cb(null, {
                        path: path,
                        size: outStream.bytesWritten
                    })
                } else {
                    streamStatus.outStream = 1
                }
            });
            uploadsStream.on('finish', function () {
                if (streamStatus.outStream == 1) {
                    cb(null, {
                        path: path,
                        size: uploadsStream.bytesWritten
                    })
                } else {
                    streamStatus.uploadStream = 1
                }
            });
        })
    }
    _removeFile(req, file, cb) {
        fs.unlink(file.path, cb)
    }
}



module.exports = function (opts) {
    return new CustomStorageEngine(opts)
}