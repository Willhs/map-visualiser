//CODE FROM : http://bl.ocks.org/keithcollins/a0564c578b9328fcdcbb

//init some global vars
var progressWidth = 910;
var progressHeight = 36;
var cityName = "";
var progressTop = 0;
var progressLeft = 0
//var speed = 65;
var progressBarSpeed = 0;
var animation;

//add the progress bar svg
var progress = d3.select("#play-progress").append("svg:svg")
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
.style("fill","#fff")
.style("opacity",0);

progress.append("text")
.attr("id","mousetext")
.attr("x",progressLeft)
.attr("y",progressHeight/2 - 5)
.style("fill","#fff")
.style("opacity",0);

//mouseover
$('#scrubber')
.on("mousemove",function(e) {
	// figure out x position of mouse
	var offset = $(this).offset();
	var xpos = e.clientX - offset.left + progressHeight;
	// what percent across the rect is the mouse?
	// multiply that by the length of the data to get the index
	if(selectedExploration==null)return;
	tempIndex= Math.ceil(xpos/progressWidth*selectedExploration.events.length);
	if(selectedExploration.events[tempIndex].type=="travel"){
		cityName = selectedExploration.events[tempIndex].body;
	}

	d3.select("#mouseline")
	.style("opacity",1)
	.attr("x1",xpos)
	.attr("x2",xpos);
	d3.select("#mousetext")
	.style("opacity",1)
	.attr("x",xpos+5)
	.text("City: "+ cityName);
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
	clearInterval(animation);
	if(selectedExploration==null)return;
	currentIndex = Math.ceil(xpos/progressWidth*selectedExploration.events.length);

	animation = setInterval(function(){ play() }, progressBarSpeed);
});
//simple play, pause, replay stuff
d3.select("#play-control").on("click",function() {

	if(selectedExploration==null)return;
	currentClass = $(this).attr("class");
	if (currentClass == "play") {
		if(selectedExploration==null)return;
		$(this).removeClass("play").addClass("pause");
		playExploration(selectedExploration);
		animation = setInterval(function(){ play() }, progressBarSpeed);
	} else if (currentClass == "pause") {
		if(selectedExploration==null)return;
		$(this).removeClass("pause").addClass("play");
		pausePlayBack(selectedExploration);
		clearInterval(animation);
	} else if (currentClass == "replay") {
		if(selectedExploration==null)return;
		$(this).removeClass("replay").addClass("pause");
		currentIndex = 0;
		playExploration(selectedExploration);
		clearInterval(animation);
		animation = setInterval(function(){ play() }, progressBarSpeed);
	}
});
//this is the play function that is executed on each interval until the interval is cleared
//the speed variable at the top dictates how frequent the intervals are
function play() {
	// update what is being displayed
	if(selectedExploration==null)
		return;
	d3.select("#display-data").html("travel: "+cityName);

	// move the progress bar to the right
	var progress_xpos = currentIndex/selectedExploration.events.length*progressWidth;
	d3.select("#progress-bar").attr("x",progress_xpos);

	// stop at end
	if (currentIndex == selectedExploration.events.length-1) {
		$("#play-control").removeClass().addClass("replay");
		d3.select("#progress-bar").attr("x",progressWidth);
		clearInterval(animation);
	}

	currentIndex = currentIndex + 1;
}
function addCityName(){

}