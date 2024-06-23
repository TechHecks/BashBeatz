import express from 'express';
import * as http from 'http';
import * as fs from 'fs';
import * as mm from 'music-metadata';
import path from 'path';

const PORT = 3000;
const app = express();
const BASE_PATH = "/home/prajyot-mane/Music";  // Use forward slashes in the path

//function to extract audio metadata
async function parseAudioMetadata(musicFilePath) {
    try {
        const metadata = await mm.parseFile(musicFilePath);
        return metadata;
    } catch (err) {
        console.log(err);
    }
}
//List of supported audio file types
const supportedAudioExtensions = ['.mp3','.flac','.wav','.ogg','.m4a']

//function to check if the audio file is supported
function isAudioFile(file){
  const extension = path.extname(file).toLowerCase();
  return supportedAudioExtensions.includes(extension);
}

//fucntion to scan dirctories 
async function scanDirectory(musicDirPath) {
    const dir_data = [];
    try {
        let files = await fs.promises.readdir(musicDirPath);
        for (let file of files) {
            let complete_path = musicDirPath + "/" + file;
            //const complete_path = path.join((BASE_PATH, file));
            console.log("COMPLETE_PATH :- " + complete_path);
            const stats = await fs.promises.stat(complete_path);
            if(stats.isDirectory()){
              dir_data.push({ type: 'directory', name: complete_path });
              console.log("DIR_DATA :-");
              console.log(dir_data);
            } else if(isAudioFile(complete_path)){
               const metadata1 = await parseAudioMetadata(complete_path);
            // console.log(metadata1);
               if (metadata1 && metadata1.common) { // Added check to ensure metadata1 and metadata1.common exist
                  dir_data.push({
                      file: complete_path,
                      metadata: metadata1.common
                  });
                // console.(dir_data);
               }  
            }
            
        }
    } catch (err) {
        console.log(err);
    }
    return dir_data;
}

app.get('/', (req, res) => {
    return res.send('home page');
});

app.get('/songs', async (req, res) => {
  try{
    let result = await scanDirectory(BASE_PATH);
    console.log("RESULT :- \n");
    console.log(result)
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error scanning main directory")
  }
})

//route to scan sub-directories (1 level sub-dirs supported)
app.get('/songs/:subdirectoryPath', async (req, res) => {
  const subdirectoryPath = req.params.subdirectoryPath;
  try{
      let result = await scanDirectory(path.join(BASE_PATH, subdirectoryPath));
      console.log("SUB DIREC PATH :- " + (path.join(BASE_PATH, subdirectoryPath)));
      res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error scanning sub-directories");
  }
})
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

