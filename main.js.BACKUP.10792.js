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

	// create 'path' dir if it doesn't already exist
	if (!fs.existsSync("public/data/path")){
		fs.mkdirSync("public/data/path");
	}
<<<<<<< HEAD
	fs.writeFile("path/" + timestamp + "-savePath.json", path+"\n", function(err){
		if(err){ console.log(err); }
=======
	fs.writeFile("public/data/path/" + Timestamp + "-savePath.json", path+"\n", function(err){
		if(err){
			console.log(err);
		}
>>>>>>> b6d3c412d2f1345393e92402e11ab5462cb357f0
	});
});

//post exploration on the map for loading
app.post('/postExploration', function(req, res){
	var timestamp = new Date();
	var exploration = req.body.exploration;

<<<<<<< HEAD
	// makes 'exploration' dir for files if none exist.
	if (!fs.existsSync("Exploration")){
		fs.mkdirSync("Exploration");
	}

	console.log("writing");
	fs.writeFile("Exploration/saveExploration " + timestamp + ".json", exploration+"\n", function(err){
		if(err){ console.log(err); }
=======
	// makes 'directory' for files if none exist.
	if (!fs.existsSync("public/data/Exploration")){
		fs.mkdirSync("public/data/Exploration");
	}

	console.log("writing");
	fs.writeFile("public/data/Exploration/saveExploration " + Timestamp + ".json", exploration+"\n", function(err){
		if(err){
			console.log(err);
		}
>>>>>>> b6d3c412d2f1345393e92402e11ab5462cb357f0
	});
});

//post user info, exporation and path on the map for loading
app.post('/postUser', function(req, res){
	var timestamp = new Date();
	var user = req.body.user;
<<<<<<< HEAD
	// makes 'user' dir for files if none exist.
	if (!fs.existsSync("User-"+userInfo.user)){
		fs.mkdirSync("User-"+userInfo.user);
	}

	console.log("User-"+userInfo.user);
	fs.writeFile("User-" + userInfo.user + "/saveUser " + timestamp + ".json", user+"\n", function(err){
		if(err){ console.log(err); }
=======
	var userName = req.body.userName;
	// makes 'directory' for files if none exist.
	if (!fs.existsSync("public/data/user/User-"+userName)){
		fs.mkdirSync("public/data/user/User-"+userName);
	}
	fs.writeFile("public/data/user/User-" + userName + "/saveUser " + Timestamp + ".json", user+"\n", function(err){
		if(err){
			console.log(err);
		}
>>>>>>> b6d3c412d2f1345393e92402e11ab5462cb357f0
	});
});

app.post('/postAnnotation', function(req, res){

	for (prop in req.body.annotation){
		console.log("property: " + prop);
	}

	var timestamp = new Date();
	var annotation = req.body.annotation;
	var location = annotation.location;
	var user = annotation.user; // string
	console.log("string: " + req.body.string);

	// makes annotation dir if none exists.
	if (!fs.existsSync("annotation")){
		fs.mkdirSync("annotation");
	}
	var fileName = "annotation/" + location.properties.NAME + "/" + user + timestamp.getHours() + "/" + timestamp.getMinutes();
	fs.writeFile(fileName, annotation, function(err) {
		if (err){ console.log(err); }
	});
});

app.get("/getAnnotation", function(req, res){
	var locationName = req.body.locationName;
	var dir = "annotation/" + locationName + "/";
	if (!fs.existsSync(dir)){
		res.send(JSON.stringify(0)); // TODO use standard failure response
	}
	fs.readFile(dir, function(err, data){
		//if (err) throw err;
		res.send(JSON.stringify(data));
	});	
});
