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

//A test post implementation to evaluate correct data transaction between
//the web-application and server.
app.post('/posttest', function(req, res){
	res.send(req.body);

	var text = "ZoomIn: "+req.body.In+" ZoomOut: "+req.body.Out;
	fs.appendFile("test.txt", text+"\n", function(err){
		if(err){
			console.log(err);
		}
	});
});

// post path on the map

app.post('/postpath', function(req, res){
	res.send(req.body);

	var Timestamp = new Date();

	var path = req.body.path_taken;

	// create 'path' dir if it doesn't already exist
	if (!fs.existsSync("path")){
		fs.mkdirSync("path");
	}
	fs.writeFile("path/" + Timestamp + "-savePath.json", path+"\n", function(err){
		if(err){
			console.log(err);
		}
	});
});

//post exploration on the map for loading
app.post('/postExploration', function(req, res){
	res.send(req.body);

	var Timestamp = new Date();
	var exploration = req.body.exploration;

	// makes 'directory' for files if none exist.
	if (!fs.existsSync("Exploration")){
		fs.mkdirSync("Exploration");
	}

	console.log("writing");
	fs.writeFile("Exploration/saveExploration " + Timestamp + ".json", exploration+"\n", function(err){
		if(err){
			console.log(err);
		}
	});
});

//post user info, exporation and path on the map for loading
app.post('/postUser', function(req, res){
	res.send(req.body);

	var Timestamp = new Date();
	var user = req.body.user;
	// makes 'directory' for files if none exist.
	if (!fs.existsSync("User-"+userInfo.user)){
		fs.mkdirSync("User-"+userInfo.user);
	}

	console.log("User-"+userInfo.user);
	fs.writeFile("User-" + userInfo.user + "/saveUser " + Timestamp + ".json", user+"\n", function(err){
		if(err){
			console.log(err);
		}
	});
});