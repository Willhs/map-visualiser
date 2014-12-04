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

app.use(bodyParser());

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});

app.use(express.static(__dirname + '/public'));

// post path on the map

app.post('/postpath', function(req, res){
	var timestamp = new Date();

	var path = req.body.path_taken;

	// create 'path' path if it doesn't already exist
	var filePath = "public/data/path/";
	ensureDirExists(filePath)

	fs.writeFile(filePath + timestamp + "-savePath.json", path+"\n", function(err){
		if(err){ console.log(err); }
	});
});

app.post('/postUser', function(req, res){
	res.send(req.body);

	var Timestamp = new Date();
	var user = req.body.user;
	var username = req.body.name;
	console.log("username: "+ username);
	// makes 'directory' for files if none exist.
	if (!fs.existsSync("public/data/user/user-"+username)){
		fs.mkdirSync("public/data/user/user-"+username);
	}
	fs.writeFile("public/data/user/user-" + username + "/saveUser " + Timestamp + ".json", user+"\n", function(err){
		if(err){
			console.log(err);
		}
	});
});

//post exploration on the map for loading
app.post('/postExploration', function(req, res){
	var timestamp = new Date();
	var exploration = req.body.exploration;
<<<<<<< HEAD

	// makes 'pathectory' for files if none exist.
	var path = "public/data/Exploration/";
	ensureDirExists(path)

	console.log("writing");
	fs.writeFile(path + timestamp + ".json", exploration+"\n", function(err){
		if(err){ console.log(err); }
	});
});

//post user info, exporation and path on the map for loading
app.post('/postUser', function(req, res){
	var timestamp = new Date();
	var user = req.body.user;
	var userName = req.body.userName;
	// makes 'pathectory' for files if none exist.
	var path = "public/data/user/User-" + userName + "/";
	ensureDirExists(path);

	fs.writeFile(path + timestamp + ".json", user+"\n", function(err){
=======
	var username = req.body.name;
	// makes 'directory' for files if none exist.
	if (!fs.existsSync("public/data/user/user-"+username+"/Exploration")){
		console.log("create new exploration folder")
		fs.mkdirSync("public/data/user/user-"+username+"/Exploration");
	}

	console.log("writing");
	fs.writeFile("public/data/user/user-"+username+"/Exploration/saveExploration " + Timestamp + ".json", exploration+"\n", function(err){
		if(err){
			console.log(err);
		}
	});
});

//post file to shared user folder
app.post('/postFile', function(req, res){
	res.send(req.body);

	var Timestamp = new Date();
	var file = req.body.file;
	var to = req.body.to;
	var from = req.body.from;
	console.log("to: "+ to + " from: "+ from);
	// makes 'directory' for files if none exist.
	if (!fs.existsSync("public/data/user/user-"+to)){
		fs.mkdirSync("public/data/user/user-"+to);
	}
	if (!fs.existsSync("public/data/user/user-"+to+"/Shared")){
		fs.mkdirSync("public/data/user/user-"+to+"/Shared");
	}
	if (!fs.existsSync("public/data/user/user-"+to+"/Shared/File")){
		fs.mkdirSync("public/data/user/user-"+to+"/Shared/File");
	}

	console.log("writing");
	fs.writeFile("public/data/user/user-"+to+"/Shared/File/sharedFileFrom"+ from+" - " + Timestamp + ".json", file +"\n", function(err){
>>>>>>> 1471fe0a4b4824efcc679276fd4994d87cb15e9b
		if(err){
			console.log(err);
		}
	});
<<<<<<< HEAD
});

app.post('/postAnnotation', function(req, res){

	var annotation = JSON.parse(req.body.annotation);
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
	res.send(200);
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

// returns whether the dir existed
function ensureDirExists(path){
	if (!fs.existsSync(path)){
		fs.mkdirSync(path);
	}
}
=======
});
>>>>>>> 1471fe0a4b4824efcc679276fd4994d87cb15e9b
