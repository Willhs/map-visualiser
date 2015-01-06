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

app.use(bodyParser.json({limit: '50mb'}));

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});

app.use(express.static(__dirname + '/public'));

var USER_PATH = "public/data/user/",
	INFO_FILE_NAME = "info.json"; // all user information is store in here

//post exploration on the map for loading
app.post('/postExploration', function(req, res){

	var exploration = req.body;
	var userName = exploration.userName;
	//var timeStamp = new Date();
	var timeStamp = exploration.timeStamp;
	// makes directory for files if none exist.
	var path = USER_PATH;
	ensureDirExists(path);
	path += userName + "/";
	ensureDirExists(path);
	path += "Exploration/";
	ensureDirExists(path);

	fs.writeFileSync(path + userName + timeStamp + ".json", JSON.stringify(exploration, null, 4));	
	console.log("wrote exploration file");
	// save audio to different 
	saveAudio(exploration.audio, path + timeStamp);
	res.send(200);
});


function saveAudio(audioString, filename){
	filename += ".wav";
	fs.writeFileSync(filename, new Buffer(audioString, "binary"));

	console.log("wrote audio file");	
}

//post file to shared user folder
app.post('/shareExploration', function(req, res){
	var body = req.body;
	var exploration = req.body.exploration;
	var to = req.body.to;
	var from = req.body.from;

	var timeStamp = exploration.timeStamp;

	// makes directory for files if none exist.
	if(!doesUserExist(to)){
		res.send(false);
		return;
	}

	exploration.isNew = true; // the exploration will be new to the person recieving it

	var path = USER_PATH + to+"/";
	ensureDirExists(path);
	ensureDirExists(path +"Shared/");
	fs.writeFile(path +"/Shared/" + from  +"-"+ timeStamp + ".json", JSON.stringify(exploration) +"\n", function(err){
		if(err){
			console.log(err);
		}
	});
	res.send(true);	
	console.log("shared exploration to: "+ to + " from: "+ from);
});

app.post('/postAnnotation', function(req, res){

	var annotation = req.body;
	var timeStamp = new Date(annotation.timeStamp); // apparently timeStamp is now a string...
	var location = annotation.location;
	var userName = annotation.userName; // string
	var text = annotation.text;

	console.log("posting annotation: " + text);

	var path = "public/data/annotation/";
	// makes annotation path if none exists.
	ensureDirExists(path);
	path += location.properties.NAME + "/";
	ensureDirExists(path);

	var fileName = path + userName + " " + timeStamp.getHours() + ":"
	+ timeStamp.getMinutes() + ":" + timeStamp.getSeconds() + ".json";
	fs.writeFile(fileName, JSON.stringify(annotation, 4, null), function(err) {
		if (err){ console.log("errooor: "+err); }
	});
	res.sendStatus(200); // success code
});

app.get("/getAnnotations", function(req, res){
	var locationName = req._parsedUrl.query; // data is appended to the URL
	console.log("retrieving annotations for: " + locationName);

	var path = "public/data/annotation/";
	// ensure both dirs exist.
	ensureDirExists(path);
	path += locationName + "/";
	ensureDirExists(path);

	var annotationFiles = fs.readdirSync(path);

	// get all annotation objects (1 per file)
	var annotations = [];

	annotationFiles.forEach(function(filename, index){
		annotations.push(JSON.parse(fs.readFileSync(path+filename)));
	});

	annotations.sort(function(a, b){ // by date
		return new Date(a.timeStamp).getTime() - new Date(b.timeStamp).getTime();
	});

	res.send(JSON.stringify(annotations));
});

app.get("/getSharedExploration", function(req, res){
	console.log("get notification");
	var userName = req._parsedUrl.query; // data is appended to the URL
	var path = USER_PATH;
	// ensure both dirs exist.
	ensureDirExists(path);
	ensureDirExists(path + userName);
	path += userName + "/Shared/";
	ensureDirExists(path);

	var sharedFiles = fs.readdirSync(path);
	// if none, return '0'

	var files = [];
	sharedFiles.forEach(function(filename, index){
		files[index] = JSON.parse(fs.readFileSync(path + filename));
	});

	res.send(JSON.stringify(files));
});

app.post("/checkAuthentication", function(req, res){
	console.log("checking authentication");
	var fields = req.body;
	var userName = fields.userName;
	var pw = fields.password;

	//console.log(userName+  " " + pw);

	ensureDirExists(USER_PATH);
	var path = USER_PATH + userName + "/";
	// check if user dir exists
	doesUserExist(userName);

	var info = JSON.parse(fs.readFileSync(path + "info.json"));
	// check if uname and pw match

	console.log("un: " + info.userName + "\npw: " + info.password);

	if (info.userName === userName
			&& info.password === pw)
		res.send(JSON.stringify(true));
	else
		res.send(JSON.stringify(false));
});

app.get("/getAllFiles", function(req, res){
	var userName = req._parsedUrl.query; // data is appended to the URL

	console.log("get all files for " + userName);

	var userPath = USER_PATH + userName + "/",
		explPath = userPath + "explorations/";

	// ensure all dirs exist.	
	ensureDirExists(userPath);
	ensureDirExists(explPath);	

	// get user info
	var info = JSON.parse(fs.readFileSync(userPath + INFO_FILE_NAME));

    var allExplorations = [];

    fs.readdirSync(explPath).forEach(filename){
    	var filePath = explPath + filename;
    	if (fs.lstatSync(filePath).isDirectory())
    		continue;
    	var explorationJSON = fs.readFileSync(filePath);
    	allExplorations.push(explorationJSON);
    }

	// sends all and new explorations as separate arrays
	res.send(JSON.stringify([allExplorations, newExplorations]));
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
		if (annotation.userName === inputAnnotation.userName
				&& annotation.timeStamp === inputAnnotation.timeStamp
				&& annotation.text === inputAnnotation.text){
			fs.unlink(path + filename);
			res.sendStatus(200); // success code
		}
	});
});

app.post('/saveSharedPlayed', function(req, res){
	console.log("save Played file from shared folder to playedShared");
	var timeStamp = req.body.timeStamp;
	var exploration = req.body.filePlayed;
	var from = req.body.from;
	var to = req.body.to;
	// makes 'pathectory' for files if none exist.
	var path = USER_PATH;
	ensureDirExists(path);
	path += from+"/";
	ensureDirExists(path);
	path +="PlayedShared/";
	ensureDirExists(path)
	fs.writeFile(path +to+ timeStamp + ".json", exploration+"\n", function(err){
		if(err){ console.log(err); }
	});
});

app.post("/deletePlayed", function(req, res){
	console.log("delete Played file from shared folder");
	var playedFile = JSON.parse(req.body.playedFile);
	var userName = playedFile.user.fname;

	var path = USER_PATH;
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
//return userName has a dir
function doesUserExist(userName){
	var path = USER_PATH+ userName +"/";
	return fs.existsSync(path);
}