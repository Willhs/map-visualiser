// ORIGINAL CODE FROM : http://bl.ocks.org/keithcollins/a0564c578b9328fcdcbb

function ProgressBar() {

	// init some global vars
	var progressWidth = 910,
		progressHeight = 36,
		progressTop = 0,
		progressLeft = 0;

	// add the progress bar svg
	var progress = d3.select("#play-progress").append("svg")
	.attr("id","play-svg")
	.attr("width", progressWidth)
	.attr("height", progressHeight);
	// append a rect, which will move to the right as the animation plays
	// this creates the progress bar effect
	var bar = progress.append("rect")
	.attr("id","progress-bar")
	.attr("width", progressWidth)
	.attr("height", progressHeight)
	.attr("x",progressLeft)
	.attr("y",progressTop);

	//simple play, pause stuff
	d3.select("#play-control")
	.on("click", function() {

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
	});

	// updates the progress of the bar by displaying progression of an event of the exploration.
	// eventTime: timestamp of event
	// eventDuration: duration of the event
	this.updateProgress = function(exploration, eventTime, eventDuration){
		// the next bar position of the progress bar
		var currentPosition = eventTime / exploration.getDuration() * progressWidth,
			nextPosition = ((eventTime + eventDuration) / exploration.getDuration()) * progressWidth;
		bar.attr("x", currentPosition);

		bar.transition()
		.duration(eventDuration)
		.ease("linear in-out")
		.attr("x", nextPosition);
	}

	this.pause = function(cb){
		bar.transition()
		.duration(0)
		.each("end", cb);
	}

	this.setPosition = function(time){
		bar.attr("x", time / selectedExploration.getDuration() * progressWidth);
	}

	this.resetProgress = function(){
		// replace current transition with dummy one to stop it
		bar.transition().duration(0).each("end", function(){
			bar.attr("x", progressLeft);
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
		progress.selectAll(".event-marker")
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
					//.on("mouseover", addIframe)
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
					dy: -12,
					fill: "steelblue",
					"text-anchor": "middle"
				})
				.text(travelId);
		}
		function removeTravelText(d){
			d3.select("#" + d.body + "-text").remove();
		}

		// add mouse listener to bar
		d3.select("#play-svg").on("click", triggerPlayFromPosition);

		progress.style.visibility = "visible";
	}

	// unloads an exploration
	this.unload = function(){
		//progress.style.visibility = "hidden";
		this.resetProgress();
		// remove all event markers
		d3.selectAll(".event-marker").remove();
		// remove mouse event listener
		d3.select("progress-bar").on("click", null);
	}

	function triggerPlayFromPosition(e){
		var rect = d3.select("#play-svg");
		// figure out x position of mouse
      	var offset = $(this).offset();
      	var xpos = d3.mouse(this)[0]; // 36 ?

      	// what percent (as decimal) across the rect is the mouse?
      	var progress = xpos/progressWidth;

      	setPlaybackPosition(selectedExploration, selectedExploration.getDuration() * progress);
	}
}