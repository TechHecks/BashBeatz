//const express = require('express');
import express from 'express';
//const http = require('http');
import * as http from 'http';
//const fs = require('fs');
import * as fs from 'fs';
//const mm = require('music-metadata');
import * as mm from 'music-metadata';


const PORT = 3000;
const app = express();


const BASE_PATH = '/home/prajyot-mane/Music';

async function parseAudioMetadata(musicFilePath){
    try{
        const metadata = await mm.parseFile(musicFilePath);
        // console.log(metadata);
        return metadata;
    } catch (err) {
        console.log(err);
    }
}

async function getMusicFiles(musicDirPath) {
    let songs = [];
    try{
        let files = await fs.promises.readdir(musicDirPath);
        for(let file of files){
            // console.log("Inside getMusicFiles() :-");
            let complete_path = BASE_PATH + '/' + file;
            const metadata1 = await parseAudioMetadata(complete_path);
            // console.log(metadata1.common);
            songs.push(metadata1.common);
        }
    } catch(err){
        console.log(err);
    }
    // console.log(songs);
    return songs;
}
// getMusicFiles(BASE_PATH);
// parseAudioMetadata(BASE_PATH+'/'+"06 Can't Tell Me Nothing.mp3"); //called

app.get('/', (req, res)=>{
    return res.send('home page');
});

app.get('/songs', async(req, res)=> {
    console.log('Requested /songs');
    let songsmetadata = await getMusicFiles(BASE_PATH);
    console.log(songsmetadata);
    // res.json([{name:"Prajyot",age:56}])
    res.json(songsmetadata);
});



app.listen(PORT, () => console.log("Server Started!"));
