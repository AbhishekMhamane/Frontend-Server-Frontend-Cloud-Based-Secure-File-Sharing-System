const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const PRE = require('./proxy-reencryption/pre');
const decrypt = require('./file-encryption/de');
const fs = require('fs');
var http = require('http');

const app = express();
const API_URL = 'http://localhost:3000';
const STORAGE_URL = 'C:\\Users\\abhim\\OneDrive\\Desktop\\Frontend-Project\\Proxy-Server/public';
//middlewares
app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(cors({
    "Access-Control-Allow-Origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
}));

app.use(helmet());

app.use(morgan('dev'));

app.get('/getfile/:uid/:id', async (req, res) => {

    console.log(req.params.uid);
    console.log(req.params.id);

    let uid = req.params.uid;
    let fileid = req.params.id;

    const getFileData = await axios.get(`${API_URL}/files/filedata/${fileid}`);

    const fileData = getFileData.data;

    console.log(fileData);
    
    if(fs.existsSync(`${STORAGE_URL}/${fileData.fileName}`))
    {
        res.sendFile(`${STORAGE_URL}/${fileData.fileName}`);
    }
    else
    {
        const userKeys = await PRE.init({ g: "The generator for G1", h: "The generator for G2", returnHex: false }).then(params => {

            const B = PRE.keyGenInG2(params, { returnHex: true });
    
            return new Promise((resolve, reject) => {
    
                resolve(B);
            });
    
        }).catch(err => {
            console.log(err)
        });
    
        console.log(userKeys);
    
        const getReecncryptedData = await axios.post(`${API_URL}/proxy/${uid}/${fileid}`,
            { pk: userKeys.pk });
    
        //console.log(getReecncryptedData);
    
        const key = await PRE.init({ g: "The generator for G1", h: "The generator for G2", returnHex: false }).then(params => {
    
            const reDecrypted = PRE.reDec(getReecncryptedData.data, userKeys.sk);
    
            return new Promise((resolve, reject) => {
    
                resolve(reDecrypted);
            });
    
        }).catch(err => {
            console.log(err)
        });
    
        console.log(key.substring(0,32));
    
        const re = await downloadImage(fileid,fileData.fileName,key);
    
        if(re === 'done')
        { 
            const rett = await decrypt(`public/${fileData.fileName}.enc`,`public/${fileData.fileName}`,key.substring(0,32));
            if(rett)
            { 
                res.sendFile(`${STORAGE_URL}/${fileData.fileName}`);
            }
    
        }
    }
    

});


app.get('/downloadfile/:uid/:id', async (req, res) => {

    console.log(req.params.uid);
    console.log(req.params.id);

    let uid = req.params.uid;
    let fileid = req.params.id;

    const getFileData = await axios.get(`${API_URL}/files/filedata/${fileid}`);

    const fileData = getFileData.data;

    console.log(fileData);
    
    if(fs.existsSync(`${STORAGE_URL}/${fileData.fileName}`))
    {
        res.download(`${STORAGE_URL}/${fileData.fileName}`);
    }
    else
    {
        const userKeys = await PRE.init({ g: "The generator for G1", h: "The generator for G2", returnHex: false }).then(params => {

            const B = PRE.keyGenInG2(params, { returnHex: true });
    
            return new Promise((resolve, reject) => {
    
                resolve(B);
            });
    
        }).catch(err => {
            console.log(err)
        });
    
        console.log(userKeys);
    
        const getReecncryptedData = await axios.post(`${API_URL}/proxy/${uid}/${fileid}`,
            { pk: userKeys.pk });
    
        //console.log(getReecncryptedData);
    
        const key = await PRE.init({ g: "The generator for G1", h: "The generator for G2", returnHex: false }).then(params => {
    
            const reDecrypted = PRE.reDec(getReecncryptedData.data, userKeys.sk);
    
            return new Promise((resolve, reject) => {
    
                resolve(reDecrypted);
            });
    
        }).catch(err => {
            console.log(err)
        });
    
        console.log(key.substring(0,32));
    
        const re = await downloadImage(fileid,fileData.fileName,key);
    
        if(re === 'done')
        { 
            const rett = await decrypt(`public/${fileData.fileName}.enc`,`public/${fileData.fileName}`,key.substring(0,32));
            if(rett)
            { 
                res.download(`${STORAGE_URL}/${fileData.fileName}`);
            }
    
        }
    }
    

});

async function downloadImage (fileid,filename,key) {  

    const url = `${API_URL}/files/file/download/${fileid}`;
    const path = `public/${filename}.enc`;
    const writer = fs.createWriteStream(path)
  
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    })
  
    response.data.pipe(writer)

  

    return new Promise(async(resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
        resolve("done");
    })
  };

app.listen(3002, () => {
    console.log("server listening on port 3002");
});




    //const getFile = await axios.get(`http://localhost:3000/files/file/download/${fileid}`);

    // var file = fs.createWriteStream('public/demp.png.enc');
   
    // const request = await http.get(`http://localhost:3000/files/file/download/${fileid}`, function(response) {
    //   response.pipe(file);

    //   return new Promise((resolve, reject) =>{
    //     file.on('finish', function() {
    //         file.close();  // close() is async, call cb after close completes.
    //         resolve("yes");

    //       });
    //   });
     
    // }).on('error', function(err) { // Handle errors
    //   fs.unlink(dest); // Delete the file async. (But we don't check the result)
    //   if (cb) cb(err.message);
    // });

    //console.log(request);

    

    // if(request)
    // { 
    //     const re = await decrypt('public/demp.png.enc','public/demp.png',key.substring(0,32));
        
    //     if(re)
    //     { 
    //         res.status(200).sendFile('public/demp.png');
    //     }
    // }
    
    //console.log(getFile);  

    //res.send(userKeys);