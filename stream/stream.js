const { Transform } = require('stream');
const fs = require('fs');
const myTransformStream = new Transform({
    transform(chunk, encoding, callback) {
        // Transforme les données en majuscules
        const transformedChunk = chunk.toString().toUpperCase();
        this.push(transformedChunk);
        callback();
    }
});

fs.createReadStream('heavy.txt')
    .pipe(myTransformStream)
    .pipe(fs.createWriteStream('heavy-out.txt'));