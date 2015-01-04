//constructor for Event objects
function Event(type, body, time){
	this.type = type;
	this.body = body;
	this.time = time; // time that event occured at
}

// a record of an exploration of the map
var record = {
	user: currentUser,
	fromuser: null,
	events : [], // user navigation events that occured duraion exploration
	firstEventTime : null,
	startTimeStamp : null,

	setFromUser : function(name){
		this.fromuser = name;
	},

	setStartTimeStamp : function(timestamp){	
		this.startTimeStamp = timestamp;
	},

	addEvent : function (type, body){
		var currentTime = new Date().getTime();
		if (this.firstEventTime == null){
			this.firstEventTime = currentTime;
		}
		var timeFromFirstEvent = currentTime - this.firstEventTime;
		var event = new Event(type, body, timeFromFirstEvent);
		this.events.push(event);
	},

	getEvent : function (i){
		return this.events[i];
	},

	hasNextEvent : function (event){
		if (this.events.indexOf(event) >= this.events.length-1){
			return false;
		}
		return true;
	},

	nextEvent : function (event){
		if (!isNextEvent(event)){
			throw "there's no next events in record";
		}
		return this.events[this.events.indexOf(event) + 1];
	},

	numEvents : function(){
		return this.events.length;
	},

	isEmpty : function(){
		return this.events.length == 0;
	},

	reset : function(){
		this.events = [];
		this.firstEventTime = null;
	}
}

var records = [];
function nrecord() {
	this.user = currentUser;
	this.fromuser= null;
	this.events = []; // events that took place over the course of the exploration
	this.startTimeStamp = null;
	this.firstEventTime = null;
	this.reset = function(){
		this.events = [];
		this.firstEventTime = null;
	};
}

function handleMultipleExplorationUpload(evt){
	var files = evt.target.files;
	if(files){
		records = [];
		removeLabels("list");
		for(var i = 0, f; f=files[i]; i++){
			var r = new FileReader();

			onloads(r, i);
			r.readAsText(f);
		}
	}else{
		alert("Failed to load files");
	}
}

function onloads(r, i){
	r.onload = function(e){
		var fileRecord = JSON.parse(e.target.result);
		var rd = new nrecord();
		rd.user.sharedFileTimeStamp = fileRecord.user.sharedFileTimeStamp;
		rd.user = fileRecord.user;
		rd.events = fileRecord.events;
		rd.startTimeStamp = fileRecord.startTimeStamp;
		rd.fromuser = fileRecord.fromuser;
		tempDate = rd.startTimeStamp;
		fileName = rd.user.fname+tempDate.substring(0,10)+"---"+tempDate.substring(11,13)+"-"+tempDate.substring(14,16)+"-"+tempDate.substring(17,19)+"-"+ tempDate.substring(20,23);
		record.events = rd.events;
		record.user = rd.user;
		record.fromuser = rd.fromuser;
		record.firstEventTime = rd.firstEventTime;
		record.startTimeStamp = rd.startTimeStamp;
		addLabel(i, fileName, rd);
	};
}
function addRecords(newRecord){
	if(!contains(newRecord, records)) {records.push(newRecord);}
}

function addLabel(index, fileName, nd){
	var div = document.getElementById("list");
	var newLabel = document.createElement('labelChooseFiles');
	var fileChooseLabelDiv = document.createElement("div");
	newLabel.setAttribute("for", "labelChooseFile" +index);
	newLabel.setAttribute("id", "labelChooseFile" +index);
	newLabel.innerHTML = fileName;
	addRecords(nd);
	newLabel.onclick = function(){
		record.events = records[index].events;
		record.user = records[index].user;
		record.fromuser = records[index].fromuser;
		record.firstEventTime = records[index].firstEventTime;
		record.startTimeStamp = records[index].startTimeStamp;
		playRecording();
	};
	fileChooseLabelDiv.appendChild(newLabel);
	var fileChooseDelDiv = document.createElement("div");
	fileChooseDelDiv.className = "delDivClass";
	div.appendChild(fileChooseLabelDiv);
	var deleteButton = addDeleteButton();

	deleteButton.onclick = function () {
		console.log("click");
		if(checkMatchedTimeStamp()==0){
			deleteExplorationFile(record);
			alert(" record are equals");
		}else alert(" record are not equals");
	};

	fileChooseDelDiv.appendChild(deleteButton);
	div.appendChild(fileChooseDelDiv);
	var linebreak = document.createElement("br");
	fileChooseLabelDiv.appendChild(linebreak);
}

//beings recording of certain user navigation actions
function startRecording() {
	resetExplButtonFunction ();
	//playExplButton.disabled = true;

	// adds event listeners which record user navigation actions
	zoom.on("zoom.record", recordMovement);
	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.addEventListener("dblclick", recordTravel(city.id));
	}

	buttonImageConvert("record-button", "record_red.jpeg");
	buttonImageConvert("stop-button", "stop_red.jpeg");
	buttonImageConvert("reset-button","reset_red.jpeg");
	buttonImageConvert("save-exploration-button", "save_blue.jpeg");
	buttonImageConvert("play-exploration-button","play_green.jpg");
	stopExplButton.disabled = false;
	saveExplButton.disabled = false;
	playExplButton.disabled = false;
	recordExplButton.disabled = false;
	addRecordingGraphics();
}

//adds graphics to the map to show that recording is in progress.
function addRecordingGraphics(){
	//var points = [0, 0, width, height];
	var borderWidth = 10;
	var circleRadius = 20;
	var padding = 10;
	var bottomPadding = 10;
	var circleCX = borderWidth + circleRadius;
	var circleCY = borderWidth + circleRadius;

	svg.append("rect")
	.attr("id", "record-border")
	.attr("x", 0 + borderWidth/2)
	.attr("y", 0 + borderWidth/2)
	.attr("width", width - borderWidth)
	.attr("height", height - bottomPadding - borderWidth)
	.style("stroke", "red")
	.style("fill", "none")
	.style("stroke-width", borderWidth);

	svg.append('circle')
	.attr("id", "record-circle")
	.attr('cx', circleCX)
	.attr('cy', circleCY)
	.attr('r', circleRadius)
	.style('fill', 'red')
	.transition().duration();
}
// remove recording related graphics
function removeRecordingGraphics(){	
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();
}

//ends recording of user navigation
function stopRecording() {
	// removes event listeners which are recording user navigation.
	// goToCity.removeEventListener("click", recordTravel);
	zoom.on("zoom.record", null);//remove recording zoom listener
	//saveExplButton.disabled = false; // can now save recording.

	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.removeEventListener("onclick", recordTravel(getCityIndex(city.id)));
	}

	removeRecordingGraphics();
	
	//  gross stuff
	buttonImageConvert("record-button", "record_gray.jpeg");
	saveExplButton.disabled = false;
	if(!record.isEmpty()){
		buttonImageConvert("save-exploration-button", "save_blue.jpeg");
		buttonImageConvert("play-exploration-button", "play_green.jpg");
		buttonImageConvert("reset-button", "reset_red.jpeg");

	}else{
		buttonImageConvert("play-exploration-button", "play_gray.jpeg");
		buttonImageConvert("save-exploration-button", "save_gray.jpeg");
		buttonImageConvert("reset-button", "reset_gray.jpeg");
	}

	console.log("Recorded/Played " + record.numEvents() + " events");
}

//records an instance of a user action to travel to a place on the map
function recordTravel(cityIndex){
	return function (){
		record.addEvent("travel", cityIndex);
	}
}

//records a user pan or zoom
function recordMovement(){
	record.addEvent("movement", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

//plays a recording of navigation events (from events array)
function playRecording(){
	stopRecording();
	if (record.numEvents() == 0) {
		return; // if no events, do nothing.
	}
	function launchEvent(i){
		var currentEvent = record.getEvent(i);
		switch (currentEvent.type){
		case ("travel"):
			var cityIndex = currentEvent.body;
		goToLoc(parseInt(cityIndex));
		break;
		case ("movement"):
			var transform = currentEvent.body;
		g.attr("transform", transform);
		updateScaleAndTrans();
		break;
		}
		if (!record.hasNextEvent(currentEvent)){ return; } // if reached end of array, stop.

		var nextEvent = record.getEvent(i+1);
		var delay = nextEvent.time - currentEvent.time; // is ms, the time between current and next event

		setTimeout(launchEvent, delay, i + 1);
	}

	launchEvent(0); // launch the first event.
}

function buttonImageConvert(myImgId, imageName){
	var loc = "http://localhost:3000/image/";
	var getId = document.getElementById(myImgId);
	getId.src = loc + imageName;
}
function resetExplButtonFunction () {
	stopRecording();
	record.reset();
	currentUser.reset();
	stopExplButton.disabled = true;
	saveExplButton.disabled = true;
	playExplButton.disabled = true;
	buttonImageConvert("record-button", "record_gray.jpeg");
	buttonImageConvert('save-exploration-button', "save_gray.jpeg");
	buttonImageConvert("stop-button", "stop_gray.jpeg");
	buttonImageConvert("play-exploration-button", "play_gray.jpeg");

}

function saveExplButtonFunction () {
	stopRecording();
	buttonImageConvert("stop-button", "stop_gray.jpeg");
	buttonImageConvert("save-exploration-button", "save_gray.jpeg");
	if(!record.isEmpty()){
		record.startTimeStamp = new Date();
		currentUser.sharedFileTimeStamp.push(record.startTimeStamp);
		record.setFromUser(record.user.fname);
		saveExploration();
		currentUser.reset();
	}
	else alert("record list are empty!");
}

function loadExplButtonFunction (evt) {
	var files = evt.target.files;

	stopRecording();
	buttonImageConvert("record-button", "record_gray.jpeg");
	buttonImageConvert("play-exploration-button", "play_green.jpg");
	console.log("file: "+this.files.length );
	//if(files.length==1){	handleExplorationUpload(this.files[0]);}
	if(this.files.length>0){
		handleMultipleExplorationUpload(evt);}
	else return;
	playExplButton.disabled = false;
}

function saveExploration(){
	console.log("save: " + record.startTimeStamp);
	$.ajax({
		type: 'POST',
		url: "/postExploration",//url of receiver file on server
		data: JSON.stringify(record),
		success: function(response){ console.log(response) }, //callback when ajax request finishes
		contentType: "application/json"
	});
}