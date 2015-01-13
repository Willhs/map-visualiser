
// init some global vars
var progress_width = 910;
//var speed = 65;
var progressBarSpeed = 0;
var animation;

// add the progress bar svg
var progress = d3.select("#play-progress").append("svg:svg")
.attr("id","play-svg")
.attr("width", progress_width)
.attr("height", 36);
// append a rect, which will move to the right as the animation plays
// this creates the progress bar effect
progress.append("rect")
.attr("id","progress-bar")
.attr("width", progress_width)
.attr("height", 36)
.attr("x",0)
.attr("y",0);
// append line and text for mouseover
progress.append("line")
.attr("id","mouseline")
.attr("x1",0)
.attr("x2",0)
.attr("y1",0)
.attr("y2",36)
.style("stroke-width","2px")
.style("fill","#fff")
.style("opacity",0);
progress.append("text")
.attr("id","mousetext")
.attr("x",0)
.attr("y",15)
.style("fill","#fff")
.style("opacity",0);

// mouseover
$('#scrubber')
.on("mousemove",function(e) {
	// figure out x position of mouse
	var offset = $(this).offset();
	var xpos = e.clientX - offset.left + 36;
	// what percent across the rect is the mouse?
	// multiply that by the length of the data to get the index
	if(selectedExploration==null)return;
	currentIndex = Math.ceil(xpos/progress_width*selectedExploration.events.length);
	d3.select("#mouseline")
	.style("opacity",1)
	.attr("x1",xpos)
	.attr("x2",xpos);
	d3.select("#mousetext")
	.style("opacity",1)
	.attr("x",xpos+5)
	.text("event: ["+currentIndex+"]");
})
.on("mouseout",function(e) {
	d3.select("#mouseline").style("opacity",0);
	d3.select("#mousetext").style("opacity",0);
})
// on click do the same thing but update the data index with it
// then restart the animation from the selected index
.on("click",function(e) {
	var offset = $(this).offset();
	var xpos = e.clientX - offset.left + 36;
	$("#play-control").removeClass().addClass("pause");
	clearInterval(animation);
	if(selectedExploration==null)return;
	currentIndex = Math.ceil(xpos/progress_width*selectedExploration.events.length);
	animation = setInterval(function(){ play() }, progressBarSpeed);
});
// simple play, pause, replay stuff
d3.select("#play-control").on("click",function() {
	current_class = $(this).attr("class");
	if(selectedExploration==null)return;

	if (current_class == "play") {
		$(this).removeClass("play").addClass("pause");
		startPlayBack(selectedExploration);
		animation = setInterval(function(){ play() }, progressBarSpeed);
	} else if (current_class == "pause") {
		if(selectedExploration==null)return;
		$(this).removeClass("pause").addClass("play");
		pausePlayBack(selectedExploration);
		clearInterval(animation);
	} else if (current_class == "replay") {
		if(selectedExploration==null)return;
		$(this).removeClass("replay").addClass("pause");
		currentIndex = 0;
		startPlayBack(selectedExploration);
		clearInterval(animation);
		animation = setInterval(function(){ play() }, progressBarSpeed);
	}
});
// this is the play function that is executed on each interval until the interval is cleared
// the speed variable at the top dictates how frequent the intervals are
function play() {
	// update what is being displayed
	if(selectedExploration==null)return;
	d3.select("#display-data").html("selectedExploration.events["+currentIndex+"]: "+ selectedExploration.events[currentIndex].time);

	// move the progress bar to the right
	var progress_xpos = currentIndex/selectedExploration.events.length*progress_width;
	d3.select("#progress-bar").attr("x",progress_xpos);

	// stop at end
	if (currentIndex == selectedExploration.events.length-1) {
		$("#play-control").removeClass().addClass("replay");
		d3.select("#progress-bar").attr("x",progress_width);
		clearInterval(animation);
	}

	currentIndex = currentIndex + 1;
}
