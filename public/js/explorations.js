
// TODO: don't use global variable for this
var recording = false,
playing = false,
requestStop = false;
requestPause = false;

//constructor for Event objects
function Event(type, body, time){
	this.type = type;
	this.body = body;
	this.time = time; // time that event occured at
}

//a record of an exploration of the visualisation

function Exploration() {
	this.name = generateDefaultExplName();
	this.userName = (currentUser ? currentUser.name : null);
	this.events = []; // events that took place over the course of the exploration
	this.firstEventTime = null;
	this.timeStamp = null;//time saving at save button pressed
	this.audio = null; // blob/string representing audio
	this.isNew = true;

	this.setTimeStamp = function(timestamp){
		this.timeStamp = timestamp;
	};
	this.addEvent = function (type, body){
		var currentTime = new Date().getTime();
		if (this.firstEventTime == null){
			this.firstEventTime = currentTime;
		}
		var timeFromFirstEvent = currentTime - this.firstEventTime;
		var event = new Event(type, body, timeFromFirstEvent);
		this.events.push(event);
	};

	this.getEvent = function (i){
		return this.events[i];
	};

	this.getAudio = function(){
		return this.audio;
	}

	this.setAudio = function(audio){
		this.audio = audio;
	}

	this.hasNextEvent = function (event){
		if (this.events.indexOf(event) >= this.events.length-1){
			return false;
		}
		return true;
	};

	this.nextEvent = function (event){
		if (!isNextEvent(event)){
			throw "there's no next events in record";
		}
		return this.events[this.events.indexOf(event) + 1];
	};

	this.numEvents = function(){
		return this.events.length;
	};

	this.isEmpty = function(){
		return this.events.length == 0;
	};

	this.reset = function(){
		this.events = [];
		this.firstEventTime = null;

	};
	// transfers all properties from another exploration
	this.transferPropertiesFrom = function(exploration){
		var that = this;
		Object.getOwnPropertyNames(exploration).forEach(function(property){
			that[property] = exploration[property];
		});
	}
}

// makes a default name for an exploration
var generateDefaultExplName = function(){
	var index = 0;
	return function(){
		var name = currentUser.name + " exploration " + index;
		index++;
		return name;
	};
}();

//beings recording of certain user navigation actions
function startRecording() {
	resetExplorations();

	// adds event listeners which record user navigation actions
	zoom.on("zoom.record", recordMovement);
	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.addEventListener("dblclick", recordTravel(city.id));
	}

	currentUser.currentExpl = new Exploration();
	selectExploration(currentUser.currentExpl); // the current recording

	// starts recording audio
	if (audioRecorder)
		startAudioRecording();
	// shows that recording is in progess
	addRecordingGraphics();

	recording = true;

	changeButtonColour("record", true);
	// user can now stop the recording and do save or play immediately
	disableAction("stop");
	disableAction("pause");
	disableAction("save");
	disableAction("play");
}

//ends recording of user navigation
function stopRecording() {
	// if there is no recording, do nothing
	if (!currentUser.currentExpl)
		return;

	// removes event listeners which are recording user navigation.
	zoom.on("zoom.record", null);//remove recording zoom listener

	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.removeEventListener("onclick", recordTravel(getCityIndex(city.id)));
	}

	stopAudioRecording();

	enableAction("save");
	enableAction("play");
	disableAction("stop");
	changeButtonColour("record", false);
	enableAction("reset");

	removeRecordingGraphics();

	recording = false;

	console.log("Recorded " + currentUser.currentExpl.numEvents() + " events");
}

//plays an exploration
//assumes no other exploration is being played
var index = 0;
function startPlayBack(exploration){

	if (!exploration || exploration.numEvents() == 0) {
		alert("nothing to play");
		return; // if no events, do nothing.
	}

	function launchEvent(i){
		index = i;
		var currentEvent = exploration.getEvent(i);
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

		// TODO: find better stop solution
		// stop button has been pushed or playback has been ended
		if (requestStop || !exploration.hasNextEvent(currentEvent)){
			// stop playback
			index = 0;
			enableAction("record");
			disableAction("stop");
			disableAction("pause");
			enableAction("play");
			requestStop = false, // reset this variable (sigh)
			playing = false;
			console.log("Played " + exploration.numEvents() + " events");
			return;
		}
		if(requestPause){
			index++;
			requestPause = false;
			playing = false;
			enableAction("play");
			enableAction("reset");
			disableAction("pause");
			return;

		}
		else { // continue playing events
			var nextEvent = exploration.getEvent(i+1);
			var delay = nextEvent.time - currentEvent.time; // is ms, the time between current and next event
			setTimeout(launchEvent, delay, i + 1);
		}
	}

	enableAction("stop");
	enableAction("pause");	// currently pause does nothing
	disableAction("record");
	disableAction("play");

	launchEvent(index);

	playAudio(exploration.getAudio());

	exploration.isNew = false;
	if(currentUser.getExplorations().indexOf(selectedExploration)>=0){
		updateExplorationState(selectedExploration);
	}
	updateNotifications(currentUser);
	playing = true;
	var notificationChooser= document.getElementById("notification-selector");
	notificationChooser.style.display = "none";

}

function playAudio(audioBlob){
	console.log(audioBlob);
	var audioElem = document.getElementById("exploration-audio");
	audioElem.src = (window.URL || window.webkitURL).createObjectURL(audioBlob);
	audioElem.play();
}

//stops the playback of an exploration
function stopPlayBack(exploration, state) {
	if(state.localeCompare("pause")===0){
		requestPause = true;
	}
	else if(state.localeCompare("stop")===0){
		console.log("stopped");
    	requestStop = true;
	}

//      if (!playing)
//		return;
	//stopAudio();

}

function stopAudio(){
	var audio = document.getElementById("exploration-audio");
	audio.pause();
	audio.currentTime = 0; // in seconds
}

//makes an exploration selected
function selectExploration(exploration){
	selectedExploration = exploration;
	enableAction("play");
	document.getElementById("delExplButton").value = "delete selected exploration";

	Recorder.setupDownload(selectedExploration.audio, "audio.wav");
}

//deselects current exploration
function deselectExploration(){
	selectedExploration = null;
	document.getElementById("delExplButton").value = "no exploration selected";
}

// resets to original state (no explorations selected and no recordings in progress)
function resetExplorations() {
	if (playing)
		stopPlayBack(selectedExploration);
	if (recording)
		stopRecording();
	if (currentUser)
		currentUser.resetCurrentExploration();

	deselectExploration();
	disableAction("save");
	disableAction("play");
	disableAction("stop");

	enableAction("record");
	changeButtonColour("record", false);
	console.log("reset button clicked");
}

//PRE: current exploration can't be null
function saveExploration() {
	stopRecording();
	disableAction("save"); // disables until the current recording changes

	// sets the time that this exploration was finished recording
	var expl = currentUser.getCurrentExploration();
	expl.setTimeStamp(""+new Date());

	// if the exploration has no audio, go ahead and send
	if (!expl.audio){
		sendExploration(expl);
	}
	else { // if the exploration contains audio
		// convert audio from blob to string so it can be sent
		var reader = new FileReader();
	    reader.addEventListener("loadend", audioConverted);
	    reader.readAsBinaryString(expl.getAudio());

	    function audioConverted(){
	        var audioString = reader.result;
	        expl.setAudio(audioString);
	        sendExploration(expl);
		}
	}

	function sendExploration(exploration){
		$.ajax({
			type: 'POST',
			url: "/postExploration",
			data: JSON.stringify({expl: exploration, timeStamp: ""+exploration.timeStamp}),
			success: function(response){
				console.log("Saved successful"+ exploration.timeStamp);
				selectExploration(exploration);
				currentUser.explorations.push(selectedExploration);
				updateExplorationChooser();

			},
			contentType: "application/json"
		});
	}
}

// disables an action (currently button)
function disableAction(name){
	var button = document.getElementById(name + "-exploration-button");
	button.disabled = true;
	changeButtonColour(name, false);
}

// enable an action
function enableAction(name){
	var button = document.getElementById(name + "-exploration-button");
	button.disabled = false;

	// change the colour if it's not the record button
	if (!name.localeCompare("record") == 0)
		changeButtonColour(name, true);
}

function changeButtonColour(name, state){
	var button = document.getElementById(name + "-exploration-button");

	if (state)
		button.src = IMAGE_PATH + name + "_on.jpeg";
	else
		button.src = IMAGE_PATH + name + "_off.jpeg";
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

//remove recording related graphics
function removeRecordingGraphics(){
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();
}

//records an instance of a user action to travel to a place on the map
function recordTravel(cityIndex){
	return function (){
		currentUser.getCurrentExpl().addEvent("travel", cityIndex);
	}
}

//records a user pan or zoom
function recordMovement(){
	currentUser.getCurrentExploration().addEvent("movement", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

var disableAllButtons = (function (){
	// disable all buttons before any user has logged in
	disableAction("record");
	disableAction("play");
	disableAction("stop");
	disableAction("pause");
	disableAction("save");
	disableAction("reset");
})();
