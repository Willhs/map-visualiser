/* Copyright (c) 2014, Sivan Fesherman
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

 * Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
//app.use(express.json({limit: '50mb'}));
//app.use(express.urlencoded({limit: '50mb'}));
var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});

app.use(express.static(__dirname + '/public'));

//post path on the map

app.post('/postpath', function(req, res){
	var timestamp = new Date();

	var path = req.body;

	// create 'path' path if it doesn't already exist
	var filePath = "public/data/path/";
	ensureDirExists(filePath)

	fs.writeFile(filePath + timestamp + "-savePath.json", JSON.stringify(path, null, 4), function(err){
		if(err){ console.log(err); }
	});
});

//post exploration on the map for loading
app.post('/postExploration', function(req, res){

	var exploration = req.body;
	var name = exploration.user.fname;
	//var timestamp = new Date();
	var timestamp = exploration.startTimeStamp;
	// makes directory for files if none exist.
	var path = "public/data/user/";
	ensureDirExists(path);
	path += "User-"+name;
	ensureDirExists(path);
	path +="/Exploration/";
	ensureDirExists(path);
	fs.writeFile(path +name+ timestamp + ".json", JSON.stringify(exploration, null, 4), function(err){
		if(err){ console.log(err); }
	});
	console.log("wrote exploration file");
});

//post file to shared user folder
app.post('/shareExploration', function(req, res){

	var timestamp = req.body.timestamp;
	var file = req.body.file;
	var to = req.body.to;
	var from = req.body.from;
	console.log("shared exploration to: "+ to + " from: "+ from);
	// makes directory for files if none exist.
	var path = "public/data/user/User-" + to+"/";
	ensureDirExists(path);
	ensureDirExists(path +"Shared/");
	fs.writeFile(path +"/Shared/" + from  +"-"+ timestamp + ".json", file +"\n", function(err){
		if(err){
			console.log(err);
		}
	});
});

app.post('/postAnnotation', function(req, res){

	var annotation = req.body;
	var timestamp = new Date(annotation.timestamp); // apparently timestamp is now a string...
	var location = annotation.location;
	var user = annotation.user; // string
	var text = annotation.text;

	console.log("posting annotation: " + text);

	var path = "public/data/annotation/";
	// makes annotation path if none exists.
	ensureDirExists(path);
	path += location.properties.NAME + "/";
	ensureDirExists(path);

	var fileName = path + user + " " + timestamp.getHours() + ":"
	+ timestamp.getMinutes() + ":" + timestamp.getSeconds() + ".json";
	fs.writeFile(fileName, JSON.stringify(annotation, 4, null), function(err) {
		if (err){ console.log("errooor: "+err); }
	});
	res.sendStatus(200); // success code
});

app.get("/getAnnotation", function(req, res){
	var locationName = req._parsedUrl.query; // data is appended to the URL
	console.log("retrieving annotations for: " + locationName);

	var path = "public/data/annotation/";
	// ensure both dirs exist.
	ensureDirExists(path);
	path += locationName + "/";
	ensureDirExists(path);

	var annotationFiles = fs.readdirSync(path);
	// if none, return '0'
	if (annotationFiles.length === 0){
		res.send(JSON.stringify("no_annotations")); // code for 'no files'
	}
	else {
		// get all annotation objeZcts (1 per file)
		var annotations = [];

		annotationFiles.forEach(function(filename, index){
			annotations[index] = JSON.parse(fs.readFileSync(path+filename));
		});

		annotations.sort(function(a, b){ // by date
			return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
		});

		res.send(JSON.stringify(annotations));
	}
});
app.get("/getNotification", function(req, res){
	console.log("get notification");
	var userName = req._parsedUrl.query; // data is appended to the URL
	var path = "public/data/user/";
	// ensure both dirs exist.
	ensureDirExists(path);
	ensureDirExists(path + "User-"+userName);
	path += "User-"+userName + "/Shared/";
	ensureDirExists(path);

	var sharedFiles = fs.readdirSync(path);
	// if none, return '0'
	if (sharedFiles.length === 0){
		res.send(JSON.stringify("no_notifications")); // code for 'no files'
	}
	else {
		var files = [];
		sharedFiles.forEach(function(filename, index){
			files[index] = JSON.parse(fs.readFileSync(path + filename));
		});

		res.send(JSON.stringify(files));

	}
});

app.post("/deleteAnnotation", function(req, res){
	console.log("delete annotation");
	var annotation = req.body;
	var locationName = annotation.location.properties.NAME;
	var path = "public/data/annotation/" + locationName + "/";
	var annotationFiles = fs.readdirSync(path);

	// find and delete the file corresponding to the annotation specified.
	annotationFiles.forEach(function(filename){
		var inputAnnotation = JSON.parse(fs.readFileSync(path + filename));

		//console.log(JSON.stringify(annotation) + "\n" + JSON.stringify(inputAnnotation) + "\n\n");
		// if annotations are equal, delete the file
		if (annotation.user.fname === inputAnnotation.user.fname
				&&annotation.timestamp === inputAnnotation.timestamp
				&& annotation.text === inputAnnotation.text){
			fs.unlink(path + filename);
			res.sendStatus(200); // success code
		}
	});
});

app.post('/saveSharedPlayed', function(req, res){
	console.log("save Played file from shared folder to playedShared");
	var timestamp = req.body.timestamp;
	var exploration = req.body.filePlayed;
	var from = req.body.from;
	var to = req.body.to;
	// makes 'pathectory' for files if none exist.
	var path = "public/data/user/";
	ensureDirExists(path);
	path += "User-"+from+"/";
	ensureDirExists(path);
	path +="PlayedShared/";
	ensureDirExists(path)
	fs.writeFile(path +to+ timestamp + ".json", exploration+"\n", function(err){
		if(err){ console.log(err); }
	});
});
app.post("/deletePlayed", function(req, res){
	console.log("delete Played file from shared folder");
	var playedFile = JSON.parse(req.body.playedFile);
	var userName = playedFile.user.fname;

	var path = "public/data/user/";
	ensureDirExists(path);
	path +="User-" + userName+ "/";
	ensureDirExists(path);
	path += "Shared/";
	ensureDirExists(path);
	var sharedFiles = fs.readdirSync(path);

	// find and delete the file corresponding to the annotation specified.
	sharedFiles.forEach(function(filename){

		//console.log("aa: "+path + filename);
		var inputSharedFile = JSON.parse(fs.readFileSync(path + filename));
		console.log(playedFile.startTimeStamp.localeCompare(inputSharedFile.startTimeStamp)==0);
		console.log("playedFile.startTimeStamp: "+playedFile.startTimeStamp);
		console.log("inputSharedFile.startTimeStamp: "+inputSharedFile.startTimeStamp);
		if (playedFile.startTimeStamp.localeCompare(inputSharedFile.startTimeStamp)==0){

			fs.unlink(path + filename);
			res.send(200); // success code
		}
	});
});
//returns whether the dir existed
function ensureDirExists(path){
	if (!fs.existsSync(path)){
		fs.mkdirSync(path);
	}
}