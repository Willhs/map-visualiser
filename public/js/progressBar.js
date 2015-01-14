// ORIGINAL CODE FROM : http://bl.ocks.org/keithcollins/a0564c578b9328fcdcbb

function ProgressBar(){

	//init some global vars
	var progressWidth = 910;
	var progressHeight = 36;
	var progressTop = 0;
	var progressLeft = 0;

	//add the progress bar svg
	var progress = d3.select("#play-progress").append("svg")
	.attr("id","play-svg")
	.attr("width", progressWidth)
	.attr("height", progressHeight);
	//append a rect, which will move to the right as the animation plays
	//this creates the progress bar effect
	progress.append("rect")
	.attr("id","progress-bar")
	.attr("width", progressWidth)
	.attr("height", progressHeight)
	.attr("x",progressLeft)
	.attr("y",progressTop);

	//append line and text for mouseover
	progress.append("line")
	.attr("id","mouseline")
	.attr("x1",progressLeft)
	.attr("x2",progressLeft)
	.attr("y1",progressTop)
	.attr("y2",progressHeight)
	.style("stroke-width","2px")
	.style("fill","#black")
	.style("opacity",0);

	progress.append("text")
	.attr("id","mousetext")
	.attr("x",progressLeft)
	.attr("y",progressHeight/2 - 5)
	.style("fill","black")
	.style("opacity",0);

	//mouseover
	$('#scrubber')
	.on("mousemove",function(e) {
		// figure out x position of mouse
		var offset = $(this).offset();
		var xpos = e.clientX - offset.left + progressHeight;
		// what percent across the rect is the mouse?
		// multiply that by the length of the data to get the index

		d3.select("#mouseline")
		.style("opacity",1)
		.attr("x1",xpos)
		.attr("x2",xpos);
		d3.select("#mousetext")
		.style("opacity",1)
		.attr("x",xpos+5);
		//.text("City: "+ cityName);
	})
	.on("mouseout",function(e) {
		d3.select("#mouseline").style("opacity",0);
		d3.select("#mousetext").style("opacity",0);
	})
	//on click do the same thing but update the data index with it
	//then restart the animation from the selected index
	.on("click",function(e) {
		var offset = $(this).offset();
		var xpos = e.clientX - offset.left + progressHeight;
		$("#play-control").removeClass().addClass("pause");
	});
	//simple play, pause, replay stuff
	d3.select("#play-control")
	.attr({
		transform: "translate(-37,0)"
	})
	.on("click",function() {

		var currentClass = $(this).attr("class");

		if (currentClass == "play") {
			playExploration(selectedExploration);			
		} 
		else if (currentClass == "pause") {
			requestPause(selectedExploration);
		} 
		else if (currentClass == "replay") {
			playExploration(selectedExploration);
		}
	});

	//this is the play function that is executed on each interval until the interval is cleared
	//the speed variable at the top dictates how frequent the intervals are
	this.update = function(progress) {
		// update what is being displayed
		if(selectedExploration==null)
			return;

		// move the progress bar to the right
		var progressXPos = currentIndex/selectedExploration.events.length*progressWidth;
		d3.select("#progress-bar").attr("x",progressXPos);

		// stop at end
		if (currentIndex == selectedExploration.events.length-1) {
			$("#play-control").removeClass().addClass("replay");
			d3.select("#progress-bar").attr("x",progressWidth);
			clearInterval(animation);
		}
	}

	this.updateState = function(){
		if (playing)
			$(this).removeClass().addClass("pause")
		else
			$(this).removeClass().addClass("play")
	}

	this.load = function(exploration){
		if (exploration){			
			// get all travel events
			var travelEvents = [];
			for (var i = 0; i < exploration.numEvents(); i++){
				var event = exploration.getEvent(i);
				if (event.type == "travel")
					travelEvents.push(event);
			}

			progress.selectAll(".event-marker")
				.data(travelEvents)
				.enter()
					.append("rect")
					.attr("class", "event-marker")
					// id is city
					.attr("id", function(d){ return d.body; })
					.attr({
						x: function(d, i){ return getBarPosition(d.time); },
						y: 0,
						width: 10,
						height: progressHeight,
						fill: "orange"
					})
					.on("mouseover", showTravelText)
					.on("mouseoff", removeTravelText);


			function getBarPosition(eventTime){
				return eventTime / exploration.getDuration() * progressWidth;
			}

			function showTravelText(mouseEvent){
				var travelId = mouseEvent.target.id;
				d3.select("#" + travelId)
					.append("text")
					.attr("id", travelId + "-text")
					.attr("y", -12)
					.text(travelId);
			}
			function removeTravelText(mouseEvent){
				d3.remove("#" + mouseEvent.id);
			}

			progress.style.visibility = "visible";
		}
		else {
			progress.style.visibility = "hidden";
			// remove travel markers
		}
	}

}