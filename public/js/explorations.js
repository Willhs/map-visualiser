
// TODO: don't use global variable for these?
var recording = false,
	playing = false,
	paused = false;

var	playTimeout = -1; // id for setTimeout used while playing an exploration

var audioElem = document.getElementById("exploration-audio");

var progressBar = new ProgressBar;
//var pathMove = new PathMove;

//constructor for Event objects
function Event(type, body, time){
	this.type = type;
	this.body = body;
	this.time = time; // time that event occured at
}

// an exploration of the visualisation
function Exploration() {
	this.name = generateDefaultExplName();
	this.userName = (currentUser ? currentUser.name : null);
	this.events = []; // events that took place over the course of the exploration
	this.firstEventTime = null;
	this.timeStamp = null;//time saving at save button pressed
	this.audio = null; // blob/string representing audio
	this.isNew = true;

	this.setTimeStamp = function(timestamp){
		this.timeStamp = timestamp.toString();
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
		if (exploration == null) return false;
		return this.userName === exploration.userName
			&& this.timeStamp === exploration.timeStamp;
	}
	this.getDuration = function(){
		if(this.events.length == 0)
			return 0;
		return  this.events[this.events.length-1].time;//return millisecond

	}

	// PRE: time must be > 0
	this.getEventAtTime = function(time){
		for (var i = 0; i < this.events.length; i++){
			if (this.getEvent(i).time > time)
				return this.getEvent(i-1);
		}
	}
}

//makes a default name for an exploration
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
	//selectExploration(currentUser.currentExpl); // the current recording

	// add start event
	currentUser.getCurrentExploration().addEvent("start", "");

	// starts recording audio
	if (audioRecorder)
		startAudioRecording();
	// shows that recording is in progess
	addRecordingGraphics();
	recording = true;
	updateExplorationControls();
}

//ends recording of user navigation
function stopRecording() {
	// if there is no recording, do nothing
	if (!currentUser.currentExpl || !recording)
		return;

	// removes event listeners which are recording user navigation.
	zoom.on("zoom.record", null);//remove recording zoom listener

	// cities on the map
	var mapCities = document.getElementsByClassName("place");
	for (var i = 0; i < mapCities.length; i++){
		var city = mapCities.item(i);
		city.removeEventListener("onclick", recordTravel(getCityIndex(city.id)));
	}

	currentUser.getCurrentExploration().addEvent("end", "");

	currentUser.getCurrentExploration().setTimeStamp(new Date());
	selectExploration(currentUser.getCurrentExploration());
	if (audioRecorder)
		stopAudioRecording();

	removeRecordingGraphics();

	recording = false;
	updateExplorationControls("stopped-recording");
	progressBar.load(currentUser.getCurrentExploration());
	console.log("Recorded " + currentUser.currentExpl.numEvents() + " events");
}

// index of last event which was played
var currentEventIndex = 0,
	// for pausePlayback
	lastEventTime = -1, // the time which the last playback started
	elapsedEventTime = -1; // how much time elapsed since event before pausing

// plays an exploration from the start
// PRE: no other exploration is being played
function startPlayback(exploration){
	//pathMove.movePath(exploration);
	if (!exploration || exploration.numEvents() == 0) {
		alert("nothing to play");
		return; // if no events, do nothing.
	}

	// launch the first event
	launchEvents(exploration, 0); 

	if (exploration.hasAudio()){
		playAudio(exploration.getAudio());
	}
	// update to show exploration has been played
	// TODO: don't do this if exploration is already set to be old
	if(currentUser.getExploration(exploration.timeStamp)){
		setExplorationIsOld(exploration);
	}
	exploration.isNew = false;

	updatePlaybackStarted();
	// updates GUI
	updateNotifications();
}

// launches the events of an exploration started at the ith event
// if time is specified, plays from time ... event end time. *not supported currently*
function launchEvents(exploration, i, elapsedTime){

	lastEventTime = new Date();
	currentEventIndex = i;
	var currentEvent = exploration.getEvent(i);
//	console.log("launching event at time:", currentEvent.time);

	switch (currentEvent.type){
	case ("travel"):
		var location = currentEvent.body;
		goToLoc(location, elapsedTime);
	   	break;
	case ("movement"):
		var transform = currentEvent.body;
		g.attr("transform", transform);
		updateScaleAndTrans();
		break;
	case ("end"):
		stopPlayback(exploration);
		return;
	case ("start"):		
	}

	var nextEvent = exploration.getEvent(i+1);
	var delay = nextEvent.time - currentEvent.time;
	// if resumeTime is specified, remove it from delay
	delay = elapsedTime ? delay - elapsedTime : delay;
	progressBar.updateProgress(exploration, currentEvent.time, delay);
//	pathMove.updatePathMove(exploration, currentEvent.time, delay);

	playTimeout = setTimeout(launchEvents, delay, exploration, i + 1);
}

// stops playback and resets position to the start
function stopPlayback(exploration){
	clearTimeout(playTimeout);

	if (exploration.hasAudio()){
		audioElem.pause();
		audioElem.currentTime = 0; // in seconds
	}

	updatePlaybackStopped();
	progressBar.resetProgress();
	//pathMove.reset(exploration);
	currentEventIndex = 0;
	playing = false;
	updatePlaybackStopped();
}

// pauses the current playback. cb will happen after progress bar updates
function pausePlayback(exploration, cb){
	clearTimeout(playTimeout);
	g.transition().duration(0); // stops any current transitions
	elapsedEventTime = new Date() - lastEventTime;
	paused = true;

	if (exploration.hasAudio())
		audioElem.pause();

	updatePlaybackStopped();
	progressBar.pause(cb);
///	pathMove.pause(exploration, cb);
}

// waits until next event before executing playExploration
function resumePlayback(exploration){
	var currentEvent = exploration.getEvent(currentEventIndex);
	var eventDur = exploration.getEvent(currentEventIndex+1).time - currentEvent.time,
		timeTilNextEvent = eventDur - elapsedEventTime,
		// playback position in time 
		position = currentEvent.time + elapsedEventTime;
	
	// skips the rest of the event and goes to the next one.
	// TODO: play the rest of the event, don't skip
	playTimeout = setTimeout(function(){
		launchEvents(exploration, currentEventIndex+1);
	}, timeTilNextEvent);

	if (exploration.hasAudio())
		resumeAudio(position/1000);

	updatePlaybackStarted();

	progressBar.updateProgress(exploration, position, timeTilNextEvent);
	progressBar.updateButton();
}

// sets playback position to time parameter, then plays from that position (if was playing before)
function setPlaybackPosition(exploration, time){
	var wasPlaying = playing;

	pausePlayback(exploration, function(){
		var newEvent = exploration.getEventAtTime(time);

		// TODO: go to translation  and scale of the last event		
		transformToAfterEvent(newEvent);
		currentEventIndex = exploration.events.indexOf(newEvent);
		// set the elapsed time since the last event
		elapsedEventTime = time - newEvent.time;

		progressBar.setPosition(time);

		// if already playing, continue
		if (wasPlaying)
			resumePlayback(exploration);	
	});

	// changes (transforms) map to be aftermath of event
	function transformToAfterEvent(event){
		switch (event.type){
			case ("travel"):
				var locationName = event.body;
				// instantly go to location
				// NOTE: could make this normal duration if paused
				goToLoc(locationName, 0.001);

			   	break;
			case ("movement"):
				var transform = event.body;
				g.attr("transform", transform);
				updateScaleAndTrans();
				break;
		}
	}
}

// plays audio from a blob
function playAudio(audioBlob){
	audioElem.src = (window.URL || window.webkitURL).createObjectURL(audioBlob);
	audioElem.play();
}

// assumes there is aleady audio data loaded into audioElem
// resumes from current position + skipped time (in seconds)
function resumeAudio(position){
	audioElem.position = position;
	audioElem.play();
}

// updates GUI and other things..
function updatePlaybackStopped(){
	playing = false;
	updateExplorationControls();
	progressBar.updateButton();
}

function updatePlaybackStarted(){
	paused = false;
	playing = true;
	updateExplorationControls();
	progressBar.updateButton();
}

// makes an exploration selected
function selectExploration(exploration){
	if (selectedExploration)
		deselectExploration();
	selectedExploration = exploration;
	progressBar.load(selectedExploration);
	//pathMove.load(selectedExploration);
	if(currentUser.getExplorations().indexOf(exploration)>-1 ||selectedExploration){
		enableAction("delete");
	}

	updateExplorationControls();
}

// deselects current exploration
function deselectExploration(){
	selectedExploration = null;
	progressBar.unload();
	pathMove.unload();
	disableAction("delete");
}

// resets to original state (no explorations selected and no recordings in progress)
function resetExplorations() {
	if (playing || paused)
		stopPlayback(selectedExploration);
	if (recording)
		stopRecording();
	if (currentUser)
		currentUser.resetCurrentExploration();

	updateExplorationControls();
}


// PRE: current exploration != null
function saveExploration() {
	stopRecording();
	updateExplorationControls("saved");

	// sets the time that this exploration was finished recording
	var expl = currentUser.getCurrentExploration();

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
			data: JSON.stringify({expl: exploration, timeStamp: exploration.timeStamp}),
			success: function(response){
				currentUser.explorations.push(selectedExploration);
				enableAction("delete");
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

function deleteExploration(expl){
	$.ajax({
		type: 'POST',
		url: "deleteExploration",
		data: JSON.stringify({
			userName: expl.userName,
			timeStamp: expl.timeStamp,
			hasAudio: expl.hasAudio()
		}),
		contentType: "application/json",
		success: deletedExploration
	});

	function deletedExploration(response){
		currentUser.removeExploration(expl);
		updateExplorationChooser();
		updateDeleteButton();
	}
}

function updateSelectedExploration(){
	// nothing is selected
	if (explChooser.selectedIndex === -1)
		return;

	var explTimeStamp = explChooser.options[explChooser.selectedIndex].id;
	var userExpl = currentUser.getExploration(explTimeStamp);
	resetExplorations();
	selectExploration(userExpl);
}

// ensures that an exploration is selected by selecting the first in the list
function ensureExplorationSelected(){
	if (!selectedExploration 
		&& userLoggedOn() 
		&& currentUser.explorations.length > 0){

		var explTimeStamp = explChooser.options[0].id;
		var userExpl = currentUser.getExploration(explTimeStamp);
		selectExploration(userExpl);
	}
}

function setExplorationIsOld(expl){
	expl.isNew = false;
	$.ajax({
		type: 'POST',
		url: "setExplorationIsOld",
		data: JSON.stringify({
			currentUserName:currentUser.name,
			explUserName:expl.userName, // the user who made the exploration
			timeStamp: expl.timeStamp
		}),
		contentType: "application/json"		
	});
}