//init when load the map
function PathMove(){

	var svg = d3.select("#svg_map");
	var g = svg.select("#map_area");
	this.expl = null;
	this.pausedTime = null; //this variable is for resumePathMove function when click on the progress bar (return clicked event time)
	// set Exploration when selectExploration called or stop recording
	this.setExploration = function(expl){
		this.expl = expl;
	};

	//this function will return set of cityEvents in the exploration.
	this.cityEvents = function(){
		if(this.expl==null)return;
		var citiesE = [];
		if(this.expl==null)return;
		for(var j = 0; j<this.expl.events.length;j++){
			if(this.expl.events[j].type==="travel" && !checkMatchCity(this.expl.events[j],citiesE)){
				citiesE.push(this.expl.events[j]);
			}
		}
		return citiesE;

		//this function is checking if event already in the cityEvents reject (return true).
		function checkMatchCity(event, cityEvents){
			for(var i = 0; i<cityEvents.length; i++){
				if(event.body===cityEvents[i].body && event.time==cityEvents[i].time) {
					return true;
				}
			}
			return false;
		}
	};

//	get the set of cities in the exploration return list of names
	this.citiesDisplay = function(){
		var cities=[];
		for(var i = 0; i<this.cityEvents().length; i++){
				cities.push(this.cityEvents()[i].body);
			}
		return cities;
	}

	this.setPausedTime = function(time){
		this.pausedTime = time;
	}

//	get the set of citie's x, y coordinates
	this.translates = function(){
		trans = [];
			for(var i=0; i<this.citiesDisplay().length; i++){
			var index = getCityIndex(this.citiesDisplay()[i]);
			var paths = document.getElementById(index);
			var data = paths.getAttribute('transform');
			var translate = getTranslate(data);
			trans.push(translate);
		}
		return trans;

		function getTranslate(data){
			var translationX = data.slice(data.indexOf("translate(")+10, data.indexOf(","));
			var translationY = data.slice(data.indexOf(",")+1, data.indexOf(")"));
			return [parseFloat(translationX), parseFloat(translationY)];
		}
	};

//	get the set of cities event time
	this.cityEventTimes = function(){
		times = [];
		this.cityEvents().forEach(function(event){
			times.push(event.time);
		});
		return times;
	};

//	load called when user select exploration function or stop recording function called.
	this.load = function(){
		if(this.citiesDisplay().length==0)return;
		var pathLine =g.append("path")
		.data([this.translates()])
		.attr("id","path-play")
		.attr("stroke-dasharray","4,4")
		.attr("d", d3.svg.line()
				.tension(0));

		g.selectAll(".point")
		.data(this.translates())
		.enter().append("circle")
		.attr("id", "circle")
		.attr("r",4)
		.attr("transform", function(d) { return "translate(" + d + ")"; });
		this.setText();

		g.append("circle")
		.attr("r", 5)
		.style("stroke", "gray")
		.style("fill","red")
		.attr("id", "circle-move")
		.attr("cx", pathMove.translates()[0][0])
		.attr("cy", pathMove.translates()[0][1]);

		//goToLoc(this.citiesDisplay()[0]);
		//var iframeWindow = new IframePath;
		//iframeWindow.load(this.expl);
	};

	var pausedX = -1, pausedY = -1; //value set when click pause button
	var ncx = -1, ncy = -1, ctx = -1, cty = -1;//ct: current city position, nc: next city position
	var currentCityIndex = -1;

	//	this function called at launchevents function if it is a travel event then move
	this.updatePathMove = function(eventTime){
		this.pausedTime = null;
		currentCityIndex = this.cityEventTimes().indexOf(eventTime);
		if(currentCityIndex===-1){
			return;
		}
		if(currentCityIndex+1===this.cityEventTimes().length){
			return;
		}

		var line =
			d3.svg.line()
			.x(function(d) {
				return d.x;
			})
			.y(function(d) {
				return d.y;
			});

		nextCityEventTime = this.cityEventTimes()[currentCityIndex+1];
		var eventDuration = nextCityEventTime - eventTime;

		var datas =[];
		ncx = this.translates()[0][0];
		ncy = this.translates()[0][1];
		if(this.citiesDisplay().length==0){
			return;
		}

		ctx = this.translates()[currentCityIndex][0];
		cty = this.translates()[currentCityIndex][1];
		ncx = this.translates()[currentCityIndex+1][0];
		ncy = this.translates()[currentCityIndex+1][1];
		datas = [{x:ctx,y:cty},{x:ncx,y:ncy}];
		d3.select("#circle-move")
		.attr("cx", ctx)
		.attr("cy", cty)
		.transition()
		.duration(eventDuration)
		.ease(EASE_FUNCTION)
		.attr("cx", ncx)
		.attr("cy", ncy);

		var pathLineMove= g.append("path")
		.attr({
			id: "animationPath",
			d: line(datas),
			stroke: "blue",
			"stroke-width": 2})
			.style("fill", "none");

		var totalLength = pathLineMove.node().getTotalLength();
		pathLineMove
		.attr("stroke-dasharray", totalLength + " " + totalLength)
		.attr("stroke-dashoffset", totalLength)
		.transition()
		.duration(eventDuration)
		.ease(EASE_FUNCTION)
		.attr("stroke-dashoffset", 0)
		.attrTween("point", translateAlong(pathLineMove.node()));
		//.delay(eventTime==null ? 0: ANIMATION_DELAY*this.cityEventTimes(this.expl)[0]);
		// return a point at each milisecond
		function translateAlong(path) {
			var l = path.getTotalLength();
			return function(d, i, a) {
				return function(t) {
					var p = path.getPointAtLength(t * l);
					pausedX = p.x;
					pausedY = p.y;
					return {x:p.x ,y:p.y};
				};
			};
		}
	};


//	resume from pause
	this.resumePathMove = function(eventDur){
		//the pathLineMove variable signed when the timeline pass through the fist city
		//if click on the progress bar before the yellow bar(city event).
		//will cause error: undefined is not a function (pathLineMove is undefined)
		var dur = -1;
		if(this.pausedTime<this.cityEventTimes()[0]){//pausedTime less then the first city event time
			d3.selectAll("#animationPath").remove();
			d3.select("#circle-move")
			.attr("cx", this.translates()[0][0])
			.attr("cy", this.translates()[0][1]);
			ncx = this.translates()[1][0];
			ncy = this.translates()[1][1];
			dur = 0;
		}

		//this.pausedTime set when click on the progress bar.
		else if(this.pausedTime>=this.cityEventTimes()[0]){//case: pausedTime great then first city event time
			d3.selectAll("#animationPath").remove();
			//remove all path and redraw path
			for(var i = 1; i<this.cityEventTimes().length; i++){
				//if(this.pausedTime<=this.cityEventTimes()[i+1]){
				if(this.pausedTime>=this.cityEventTimes()[0]){
					var line = g.append("line")
					.attr({
						id: "animationPath",
						x1: this.translates()[i-1][0],
						y1: this.translates()[i-1][1],
						x2: this.translates()[i][0],
						y2: this.translates()[i][1],
						stroke: 'blue',
						'stroke-width': 2})
						.style("fill", "none");
				}
				if(this.cityEventTimes()[i]>this.pausedTime && this.cityEventTimes()[i-1]<this.pausedTime) {
					currentCityIndex = i-1;
					//reset circle FROM position and TO position
					d3.select("#circle-move")
					.attr("cx", this.translates()[currentCityIndex][0])
					.attr("cy", this.translates()[currentCityIndex][1]);
					ncx = this.translates()[currentCityIndex+1][0];
					ncy = this.translates()[currentCityIndex+1][1];
					//duration from paused point to next city event time
					dur = this.cityEventTimes()[currentCityIndex+1]-this.pausedTime;

					break;
				}
			}
		}
		else if(this.pausedTime == null){ //
			if(pausedX===-1)return; //pausedX == -1 <==> paused == false
			dur = eventDur*(lineDistance({x:pausedX,y:pausedY},{x:ncx, y:ncy})/lineDistance({x:ctx,y:cty},{x:ncx,y:ncy}));
		}

		//ease function "cubic-out" will redraw from paused position
		d3.select("#animationPath")
		.transition()
		.duration(dur)
		.ease("cubic-out")
		.attr("stroke-dashoffset", 0);
		//.delay(currentCityEventTime==null ? 0: ANIMATION_DELAY*this.cityEventTimes(this.expl)[0]);
		d3.select("#circle-move")
		.transition()
		.duration(dur)
		.ease("cubic-out")
		.attr("cx", ncx)
		.attr("cy", ncy);

		function lineDistance( point1, point2 ){
			var xs = 0;
			var ys = 0;
			xs = point2.x - point1.x;
			xs = xs * xs;
			ys = point2.y - point1.y;
			ys = ys * ys;

			return Math.sqrt( xs + ys );
		}
	};

//	pause
	this.pause = function(){
		if(this.citiesDisplay().length==0)return;
		d3.selectAll("#circle-move").transition()
		.duration(0);

		d3.selectAll("#animationPath").transition()
		.duration(0);
	};

	this.unload = function(){
		if(!this.citiesDisplay())return;
		d3.selectAll("#path-play").remove();
		d3.selectAll("#circle").remove();
		d3.select("#circle-move").remove();
		d3.selectAll("#animationPath").remove();
		this.resetText();
		this.pausedTime = null;
	};

	this.reset = function(){
		pausedX = -1;
		pausedY = -1;
		if(this.citiesDisplay().length==0)return;
		d3.selectAll("#animationPath").remove();
		d3.selectAll("#circle-move")
		.attr("cx", this.translates()[0][0])
		.attr("cy", this.translates()[0][1]);
		this.resetText();
		this.pausedTime = null;
	};


	this.cityIndex = function(cityEventTimes, eventTime, currentCityIndex){
		var index = null;
		for(var i = currentCityIndex; i<this.citiesDisplay().length; i++){
			for(var j = 1; j<this.expl.events.length-1; j++){
				if(this.expl.events[j].type ==="travel" && this.expl.events[j].body===this.citiesDisplay()[i] && eventTime === cityEventTimes[i]){
					index = i;
					return index;
				}
			}
		}
		return null;
	};

	this.setText = function(){
		for(var i = 0; i<this.citiesDisplay().length; i++){
			var cityNames = this.citiesDisplay();
			var pathed = false;
			var index = getCityIndex(cityNames[i]);
			var cityText = document.getElementById(index);
			cityText.setAttribute("font-size","9px");
			cityText.setAttribute("fill",'#FF0000');
			cityText.setAttribute("dy" , "1.6em");
			cityText.setAttribute("dx" , "0.3em");
//			var subStrCityName = cityText.innerHTML.substr(cityText.innerHTML.length-cityNames[i].length);
//			if(cityNames.indexOf(cityText.innerHTML)!==-1){
//			cityText.innerHTML = i+ " "+cityNames[i];
//			}
//			else if(cityNames[i]===(subStrCityName)){
//			cityText.innerHTML = cityText.innerHTML.substring(0,cityText.innerHTML.indexOf(subStrCityName))+" "+ i +subStrCityName;
//			}



		}
	};
	this.resetText = function(){
		$(".place-label").each(function(index,value){
			$(this).attr("font-size","12px");
			$(this).attr("fill" , '#000000');
			$(this).attr("dy" , ".35em");
			$(this).attr("dx" , "0em");
		});
	};
}
