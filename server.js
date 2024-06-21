import express from 'express';
import * as http from 'http';
import * as fs from 'fs';
import * as mm from 'music-metadata';

const PORT = 3000;
const app = express();
const BASE_PATH = 'D:/Music';  // Use forward slashes in the path


async function parseAudioMetadata(musicFilePath) {
    try {
        const metadata = await mm.parseFile(musicFilePath);
        return metadata;
    } catch (err) {
        console.log(err);
    }
}

async function getMusicFiles(musicDirPath) {
    let songs = [];
    try {
        let files = await fs.promises.readdir(musicDirPath);
        for (let file of files) {
            let complete_path = BASE_PATH + '/' + file;
            const metadata1 = await parseAudioMetadata(complete_path);
            if (metadata1 && metadata1.common) { // Added check to ensure metadata1 and metadata1.common exist
                songs.push({
                    file: complete_path,
                    metadata: metadata1.common
                });
            }
        }
    } catch (err) {
        console.log(err);
    }
    return songs;
}

app.get('/', (req, res) => {
    return res.send('home page');
});

// Updated /songs route to stream music file
app.get('/songs/:filename', async (req, res) => {
    console.log('Requested /songs/' + req.params.filename);
    try {
        const filePath = BASE_PATH + '/' + req.params.filename;
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1]
                ? parseInt(parts[1], 10)
                : fileSize - 1;

            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(filePath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
            };

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
            };

            res.writeHead(200, head);
            fs.createReadStream(filePath).pipe(res);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send('Error streaming the song');
    }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => console.log("Server Started!"));

