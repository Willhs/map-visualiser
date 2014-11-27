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
	console.log(req.body);
	res.send(req.body);

	var text = "ZoomIn: "+req.body.In+" ZoomOut: "+req.body.Out;
	fs.appendFile("test.txt", text+"\n", function(err){
		if(err){
			console.log(err);
		} else{
			console.log("Dond!");
		}

	});
});

// post path on the map

app.post('/postpath', function(req, res){
	console.log(req.body);
	res.send(req.body);

	var Timestamp = new Date();

	//file formate: Timestamp \t Ease_Function \t Animation_Delay \t User_Distance \t Actual_Distance \t User_Direction \t Actual_Direction	\t path taken
	var path = req.body.path_taken;

	fs.writeFile("path/" + Timestamp + "-savePath.json", path+"\n", function(err){

		if(err){
			console.log(err);
		} else{
			console.log("Dond!");
		}

	});
});

//post exploration on the map for loading
app.post('/postExploration', function(req, res){
	console.log(req.body);
	res.send(req.body);

	var Timestamp = new Date();
	//file formate: Timestamp \t Ease_Function \t Animation_Delay \t User_Distance \t Actual_Distance \t User_Direction \t Actual_Direction	\t path taken
	var exploration = req.body.exploration;

	fs.writeFile("Exploration/saveExploration " + Timestamp + ".json", exploration+"\n", function(err){

		if(err){
			console.log(err);
		} else{
			console.log("Dond!");
		}

	});
});

