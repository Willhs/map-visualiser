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
var btoa = require("btoa");
var fs = require('fs');
var app = express();

app.use(bodyParser.json({limit: '50mb'}));

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});

app.use(express.static(__dirname + '/public'));

var USER_PATH = "public/data/user/",
	USER_INFO_FILE_NAME = "usersInfo.json"; // all user information is store in here

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

	var users = JSON.parse(fs.readFileSync(USER_PATH + USER_INFO_FILE_NAME));
	// check if uname and pw match

	var authenticated = false;

	users.forEach(function(user){
		if (user.userName === userName
				&& user.password === pw){
			authenticated = true;
			console.log("logged in with un: " + user.userName + "\npw: " + user.password);
		}
	});

	res.send(JSON.stringify(authenticated));
});

app.get("/getUserExplorations", function(req, res){
	var userName = req._parsedUrl.query; // data is appended to the URL

	console.log("get all explorations for " + userName);

	var userPath = USER_PATH + userName + "/",
		explPath = userPath + "explorations/";

	console.log("in " + explPath);

	// ensure all dirs exist.
	ensureDirExists(userPath);
	ensureDirExists(explPath);

	// get user info
    var allExplorations = [];

    fs.readdirSync(explPath).forEach(function(filename){
    	var filePath = explPath + filename;
    	if (fs.lstatSync(filePath).isDirectory())
    		return;
    	var exploration = JSON.parse(fs.readFileSync(filePath));

    	// if exploration has audio, grab audio and attach to the exploration
    	if (exploration.audio){
    		var audioPath = exploration.audio;
    		var fd = fs.readFileSync(audioPath, "binary");
    		var ascii = btoa(fd);
	    	exploration.audio = ascii;
    	}

    	allExplorations.push(exploration);
    });

	// sends all and new explorations as separate arrays
	res.send(JSON.stringify(allExplorations));
});

//post exploration on the map for loading
app.post('/postExploration', function(req, res){

	var exploration = req.body;
	var timeStamp = exploration.timeStamp;
	var userName = exploration.userName;
	// makes directory for files if none exist.
	var path = USER_PATH;
	ensureDirExists(path);
	path += userName + "/";
	ensureDirExists(path);
	path += "explorations/";
	ensureDirExists(path);

	// save audio to different file
	if (exploration.audio){
		var audioPath = saveAudio(exploration.audio, path + "audio/", timeStamp);
		// replace audio data with audio file location.
		exploration.audio = audioPath;
	}

	function saveAudio(audioString, path, timeStamp){
		ensureDirExists(path);
		var filename = path + timeStamp + ".wav";
		fs.writeFileSync(filename, new Buffer(audioString, "binary"));

		console.log("wrote audio file "+filename);
		return filename;
	}

	var fileName = userName + timeStamp + ".json";
	var filePath = path + fileName;

	fs.writeFileSync(filePath, JSON.stringify(exploration, null, 4));
	console.log("wrote exploration file \"" + fileName + "\"");

	res.sendStatus(200);
});


app.post("/deleteExploration", function(req, res){
	console.log("delete exploration");

	var userName = req.body.userName;
	var timeStamp = req.body.timeStamp;
	var hasAudio = req.body.hasAudio;

	var path = USER_PATH;
	ensureDirExists(path);
	path += userName + "/";
	ensureDirExists(path);
	path += "explorations/";
	ensureDirExists(path);
	var explFiles = fs.readdirSync(path);

	// find and delete the file corresponding to the annotation specified.
	explFiles.forEach(function(filename){
		var filePath = path + filename;
		if (fs.lstatSync(filePath).isDirectory())
			return; // if the file is a directory
		var exploration = JSON.parse(fs.readFileSync(filePath));
		if (timeStamp.localeCompare(exploration.timeStamp)==0){
			// found match
			fs.unlinkSync(filePath);

			// delete audio file if there is one
			if (hasAudio){
				fs.unlinkSync(exploration.audio);
			}			
		}
	});
	res.sendStatus(200);
});

function saveAudio(audioString, path, timeStamp){
	var filename = path + timeStamp + ".wav";
	fs.writeFileSync(filename, new Buffer(audioString, "binary"));

	console.log("wrote audio file "+filename);
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
	ensureDirExists(path +"explorations/");
	fs.writeFile(path +"/explorations/" + from  +"-"+ timeStamp + ".json", JSON.stringify(exploration) +"\n", function(err){
		if(err){
			console.log(err);
		}
	});
	res.send(true);
	console.log("shared exploration to: "+ to + " from: "+ from);
});

app.post("/setExplorationIsOld", function(req, res){
	console.log("setting exploration isNew");
	var update = req.body;
	var currentUserName = update.currentUserName;
	var explUserName = update.explUserName;
	var timeStamp = update.timeStamp;
	var path = USER_PATH;
	// ensure both dirs exist.
	path += currentUserName + "/";
	path += "explorations/";

	// find the exploration with the right user and timestamp, and change the isNew property
	var explFiles = fs.readdirSync(path);
	var found;

	explFiles.forEach(function(filename, index){
		var filePath = path + filename;
		if (fs.lstatSync(filePath).isDirectory())
			return; // if the file is a directory
		var exploration = JSON.parse(fs.readFileSync(filePath));
		console.log("index: " +index+" username:"+explUserName + "  timeStamp: "+timeStamp);
		console.log("exploration.userName:"+exploration.userName + "  exploration.timeStamp: "+exploration.timeStamp);

		if(explUserName === exploration.userName &&
				timeStamp === exploration.timeStamp){
			// set the property
			exploration.isNew = false;
			fs.writeFileSync(filePath, JSON.stringify(exploration, null, 4));
			console.log("matched");
			res.sendStatus(200);
			found = true;
			return;
		}
	});
	if (!found)
		res.sendStatus(404); // not found
});

//check userName if match return true, if not return false
app.post("/checkUsersFile", function(req, res){
	console.log("checking matching user name");
	var fields = req.body;
	var userName = fields.userName;
	var json = fs.readFileSync(USER_PATH + USER_INFO_FILE_NAME);
	eval("var info = "+json);

	// check if uname and pw match
	var send = 1;
	info.forEach(function(user){
		if (user.userName === userName){
			console.log("matched");
			send = 0;
			res.send(JSON.stringify(true));
		}
	});
	if(send===1){
		console.log("not matched");
		res.send(JSON.stringify(false));
	}
});

//add new user's userName and password into logonInfo.json file
app.post("/createAccount", function(req, res){
	var fields = req.body;
	var userName = fields.userName;
	var password = fields.password;
	console.log("adding new user name and password to logonInfo file: "+ userName +"  "+ password);
	var json = fs.readFileSync(USER_PATH + USER_INFO_FILE_NAME);
	eval("var info = "+json);
	var newUser = {"userName":userName, "password":password};
	info.push(newUser);
	fs.writeFileSync(USER_PATH + USER_INFO_FILE_NAME, JSON.stringify(info, null, 4)+"\n");
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

app.post("/deleteAnnotation", function(req, res){
	console.log("delete annotation");
	var annotation = req.body;
	var locationName = annotation.location.properties.NAME;
	var path = "public/data/annotation/" + locationName + "/";
	var annotationFiles = fs.readdirSync(path);

	// find and delete the file corresponding to the annotation specified.
	annotationFiles.forEach(function(filename){
		var inputAnnotation = JSON.parse(fs.readFileSync(path + filename));

		// if annotations are equal, delete the file
		if (annotation.userName === inputAnnotation.userName
				&&annotation.timestamp === inputAnnotation.timestamp
				&& annotation.text === inputAnnotation.text){
			fs.unlinkSync(path + filename);
			res.sendStatus(200); // success code
		}
	});
});

//returns whether the dir existed
function ensureDirExists(path){
	if (!fs.existsSync(path)){
		fs.mkdirSync(path);
	}
}
//return if there exists a user with input userName
function doesUserExist(userName){
	var logonFile = fs.readFileSync(USER_PATH + USER_INFO_FILE_NAME);
	var users = JSON.parse(logonFile);
	var exist = false;

	users.forEach(function(user){
		if (user.userName.localeCompare(userName) === 0){
			exist = true;
		}
	});
	return exist;
}