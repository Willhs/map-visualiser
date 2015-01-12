
// TODO: don't use global variable for these?
var recording = false,
	playing = false,
	requestStop = false,
	requestPause = false;

var audioElem = document.getElementById("exploration-audio");

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

	this.hasAudio = function(){
		return this.audio ? true : false;
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

	this.equals = function(exploration){
		return this.firstEventTime === exploration.firstEventTime;
	}
	this.getDuration = function(){
		return  this.events[this.events.length-1].time;//return millisecond

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

// begins recording of certain user navigation actions and audio
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

	if (audioRecorder)
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

var currentIndex = 0;

// plays OR resumes an exploration
// PRE: no other exploration is being played
function playExploration(){

	if (!exploration || exploration.numEvents() == 0) {
		alert("nothing to play");
		return; // if no events, do nothing.
	}
	function launchEvent(i){

		var currentEvent = exploration.getEvent(i);
		var nextEvent = exploration.getEvent(i+1);
		//console.log("i " + currentIndex);
		currentIndex = i;

		// TODO: find better stop solution
		// stop button has been pushed or playback has been ended
		if (requestStop || !exploration.hasNextEvent(currentEvent)){
			requestStop = false, // reset this variable (sigh)
			updateThings();
			currentIndex = 0;
		}
		else if (requestPause){
			requestPause = false;
			updateThings();
		}
		else { // continue playing events				
			switch (currentEvent.type){
			case ("travel"):
				var location = currentEvent.body;
			    goToLoc(location);
			   	break;
			case ("movement"):
				var transform = currentEvent.body;
				g.attr("transform", transform);
				updateScaleAndTrans();
				break;
			}
			
			var delay = nextEvent.time - currentEvent.time; // is ms, the time between current and next event
			processBar.value = processBar.value +delay;
			document.getElementById("processState").innerHTML = "State: "+ ((processBar.value/processBar.max)*100).toFixed(2) + "%";
			setTimeout(launchEvent, delay, i + 1);
		}

		function updateThings(){
			enableAction("play");
			enableAction("reset");
			enableAction("record");
			disableAction("pause");
			disableAction("stop");
			playing = false;
		}			
	}

	enableAction("stop");
	enableAction("pause");
	disableAction("record");
	disableAction("play");

//	console.log("start index: " + currentIndex);
	launchEvent(currentIndex); // launch the first event
	playAudio(exploration.getAudio());

	// update to show exploration has been played
	if (selectedExploration.isNew 
		&& !selectedExploration.equals(currentUser.getCurrentExploration())){
		setExplorationIsOld(selectedExploration);
	}
	// updates GUI
	updateNotifications(currentUser);
	notificationSelector.style.display = "none";

	playing = true;
	
}

// plays audio from the last position it was left at (determined by audio element)
function playAudio(audioBlob){	
	audioElem.src = (window.URL || window.webkitURL).createObjectURL(audioBlob);
	audioElem.play();
}

//stops the playback of an exploration
function requestStop(exploration) {
	requestStop = true;
}

function requestPause(exploration){
	requestPause = true;
}

function stopPlayback(exploration){	
	requestStop = false, // reset this variable (sigh)
	currentIndex = 0;

	if (exploration.hasAudio()){
		audioElem.pause();
		audioElem.currentTime = 0; // in seconds
	}

	updatePlaybackStopped();
}

function pausePlayback(exploration){
	requestPause = false;	

	if (exploration.hasAudio())
		audio.pause();

	updatePlaybackStopped();
}

// updates GUI and other things..
function updatePlaybackStopped(){
	enableAction("play");
	enableAction("reset");
	enableAction("record");
	disableAction("pause");
	disableAction("stop");
	playing = false;
}

// makes an exploration selected
function selectExploration(exploration){
	selectedExploration = exploration;
	delButton.value = "delete selected exploration";
	enableAction("play");
}

// deselects current exploration
function deselectExploration(){
	selectedExploration = null;
	delButton.value = "no exploration selected";
}

// resets to original state (no explorations selected and no recordings in progress)
function resetExplorations() {
	if (playing)
		requestStop(selectedExploration);
	if (recording)
		stopRecording();
	if (currentUser)
		currentUser.resetCurrentExploration();

	deselectExploration();
	disableAction("save");
	disableAction("play");
	disableAction("stop");

	if (userLoggedOn()){
		console.log("enable record");
		enableAction("record");
	}
	else {
		disableAction("record");
	}
}

// PRE: current exploration != null
function saveExploration() {
	stopRecording();
	disableAction("save"); // disables until the current recording changes

	// sets the time that this exploration was finished recording
	var expl = currentUser.getCurrentExploration();
	expl.setTimeStamp(new Date().toString());

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

// remove recording related graphics
function removeRecordingGraphics(){
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();
}

//records an instance of a user action to travel to a place on the map
function recordTravel(cityIndex){
	return function (){
		currentUser.getCurrentExploration().addEvent("travel", cityIndex);
	}
}

//records a user pan or zoom
function recordMovement(){
	currentUser.getCurrentExploration().addEvent("movement", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}