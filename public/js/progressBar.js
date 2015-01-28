// ORIGINAL CODE FROM : http://bl.ocks.org/keithcollins/a0564c578b9328fcdcbb

function ProgressBar() {

	// init some global vars
	var progressWidth = 910,
		progressHeight = 36,
		progressTop = 0,
		progressLeft = 0;

	
	// add the progress bar svg
	var progressSVG = d3.select("#bar-container").append("svg")
	.attr("id","play-svg")
	.attr("width", progressWidth)
	.attr("height", progressHeight);
	// append a rect, which will move to the right as the animation plays
	// this creates the progress bar effect
	var bar = progressSVG.append("rect")
	.attr("id","progress-bar")
	.attr("width", progressWidth)
	.attr("height", progressHeight)
	.attr("x",progressLeft)
	.attr("y",progressTop);

	//simple play, pause stuff
	var playControl = d3.select("#play-control");

	// updates the progress of the bar by displaying progression of an event of the exploration.
	// eventTime: timestamp of event
	// eventDuration: duration of the event
	this.updateProgress = function(exploration, eventTime, eventDuration){
		// the next bar position of the progress bar
		var currentPosition = eventTime / exploration.getDuration() * progressWidth,
			nextPosition = ((eventTime + eventDuration) / exploration.getDuration()) * progressWidth;

		// update bar with current position	
		bar.attr("x", currentPosition);

		// hide button
		insertButton.css("visibility", "hidden");

		// start transition
		bar.transition()
		.duration(eventDuration)
		.ease("linear in-out")
		.attr("x", nextPosition);
	}

	this.pause = function(cb){
		bar.transition()
		.duration(0)
		.each("end.cb", cb);

		insertButton.css("visibility", "visible");
		showTimeText(getCurrentPlaybackTime());
	}

	this.setPosition = function(time){
		// if selectedExploration is null, set position to 0 and return
		if (!selectedExploration){
			bar.attr("x", 0);
			return;	
		} 
		var progress = time / selectedExploration.getDuration();
		bar.attr("x", progress * progressWidth);
		showTimeText(getCurrentPlaybackTime());
	}

	this.resetProgress = function(){
		var that = this; // store this
		// replace current transition with dummy one to stop it
		bar.transition().duration(0).each("end", function(){
			that.setPosition(0);
		});
	}

	this.updateButton = function(){
		if (playing && !paused)
			$("#play-control").removeClass().addClass("pause");
		else if (!playing && !paused)
			$("#play-control").removeClass().addClass("start");
		else
			$("#play-control").removeClass().addClass("resume");
	}

	this.load = function(exploration){
		// get all travel events
		var travelEvents = [];
		var barWidth = 5;

		for (var i = 0; i < exploration.numEvents(); i++){
			var event = exploration.getEvent(i);
			if (event.type == "travel")
				travelEvents.push(event);
		}

		// add event markers
		progressSVG.selectAll(".event-marker")
			.data(travelEvents)
			.enter()
			.append("g")
				.attr({
					// id is city name
					id: function(d){ return d.body; },
					class: "event-marker",
				})
				.append("rect")
					.attr({
						x: function(d){ return getEventPosition(d.time) - barWidth/2; },
						y: 0,
						width: barWidth,
						height: progressHeight,
						fill: "orange"
					})
					.on("mouseover", showTravelText)
					.on("mouseout", removeTravelText);


		function getEventPosition(eventTime){
			return eventTime / exploration.getDuration() * progressWidth;
		}

		function showTravelText(d){
			var travelId = d.body;
			d3.select("#"+travelId)
				.insert("text")
				.attr({
					id: travelId + "-text",
					dx: function(d){ return getEventPosition(d.time); },
					dy: 12,
					fill: "steelblue",
					"text-anchor": "middle"
				})
				.text(travelId);
		}
		function removeTravelText(d){
			d3.select("#" + d.body + "-text").remove();
		}

		// add listener to play control
		playControl.on("click", function() {
			var currentClass = $("#play-control").attr("class");

			if (currentClass == "start") {
				startPlayback(selectedExploration);
			}
			else if (currentClass == "resume"){
				resumePlayback(selectedExploration);
			}
			else if (currentClass == "pause") {
				pausePlayback(selectedExploration);
			}
			else if (currentClass == "replay") {
				startPlayback(selectedExploration);
			}
		})

		// add mouse listener to bar
		progressSVG.on("click", triggerPlayFromPosition);
		// add hover listener
		progressSVG.on("mousemove", function(){ showTimeText(getTimeOfXpos(d3.mouse(this)[0])); });
		// mouseoff listener
		progressSVG.on("mouseout", this.hideTimeText);
		// show 
		progressSVG.style.visibility = "visible";

		// show title and duration text elements
		explorationTitle.text(exploration.name + ", " + exploration.timeStamp);
		explorationTitle.show();
		showDurationText();
	}

	// unloads an exploration
	this.unload = function(){
		//progressSVG.style.visibility = "hidden";
		this.resetProgress();
		// remove all event markers
		progressSVG.selectAll(".event-marker").remove();
		// remove mouse event listener
		progressSVG.on("click", null);
		// remove mousemove listener
		progressSVG.on("mousemove", null);
		// remove mouseoff listener
		progressSVG.on("mouseout", null);
		// remove playControl listener
		playControl.on("click", null);
		// hide text and insert button		
		timeText.hide();
		insertButton.css("visibility", "hidden");
		explorationTitle.hide();
		durationText.hide();
	}

	function triggerPlayFromPosition(e){
		var rect = d3.select("#play-svg");
		// figure out x position of mouse
      	var offset = $(this).offset();
      	var xpos = d3.mouse(this)[0]; // 36 ?

      	setPlaybackPosition(selectedExploration, getTimeOfXpos(xpos));
	}

	// returns the x position of the bar at this time
	function getXPosOfTime(time){
		var progress = time / selectedExploration.getDuration();
		return progress * progressWidth;
	}

	function getTimeOfXpos(xpos){
		// what percent (as decimal) across the rect is the mouse?
		var progress = xpos / progressWidth;
		return progress * selectedExploration.getDuration();
	}

	// returns the x position of the bar as it is now
	function getCurrentProgressX(){
		return parseInt(bar.attr("x"));
	}

	// displays insert button above the current playback position
	function showTimeText(millis){
		// convert millis to ss:mm
		var date = new Date(millis);
		var minutes = date.getMinutes().toString();
		var seconds = date.getSeconds() < 10 	? "0" + date.getSeconds().toString()
												: date.getSeconds();

		var progressPosition = getXPosOfTime(millis);
		var	padding = 10;

		var timePosition = {
			top: 0,
			left: (progressPosition - timeText.outerWidth()/2)
		};

		timeText.show(); // jquery
		timeText.text(minutes + ":" + seconds);
		timeText.css(timePosition); // sets position relative to parent		
	}

	function showDurationText(){
		durationText.text(selectedExploration.getDuration());
		durationText.show();
	}
	// used in explorations
	this.hideTimeText = function(){
		timeText.hide();
	}
}