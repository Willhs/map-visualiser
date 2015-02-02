//init when load the map
function PathMove(){

	var svg = d3.select("#svg_map");
	var g = svg.select("#map_area");
	var pathLine = null;
	var pathMove= null;
	this.expl = null;
	// set Exploration when selectExploration called or stop recording
	this.setExploration = function(expl){
		this.expl = expl;
	}
	// get the set of cities in the exploration return list of names
	this.citiesDisplay = function(){
		if(this.expl==null)return;
		var cities=[];
		this.expl.events.forEach(function(event){
			if(event.type.localeCompare("travel")==0){
				cities.push(event.body);
			}
		});
		return cities;
	}

	// get the set of citie's x, y coordinates
	this.translates = function(){
		trans = [];
		this.citiesDisplay().forEach(function(cityName){
			var index = getCityIndex(cityName);
			var paths = document.getElementById(index);
			var data = paths.getAttribute('transform');
			var translate = getTranslate(data);
			trans.push(translate);
		});
		return trans;
	};

	// get the set of cities event time
	this.cityEventTimes = function(){
		times = [];
		this.expl.events.forEach(function(event){
			if(event.type === "travel"){
				times.push(event.time);
			}
		});
		return times;
	};

	// load called when user select exploration function or stop recording function called.
	this.load = function(){
		if(this.citiesDisplay().length==0)return;
		pathLine =g.append("path")
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
		appendCircle();

		goToLoc(this.citiesDisplay()[0]);
		//var iframeWindow = new IframePath;
		//iframeWindow.load(this.expl);
	};

	var pausedX = -1, pausedY = -1; //value set when click pause button
	var ncx = -1, ncy = -1, ctx = -1, cty = -1;//ct: current city position, nc: next city position

	//this function called at launchevents function if it is a travel event then move
	this.updatePathMove = function(eventTime){
		var currentCityIndex = this.cityEventTimes().indexOf(eventTime);
		console.log(currentCityIndex);
		if(currentCityIndex===-1){
			console.log("reutrn");
			return;
		}
		if(currentCityIndex+1===this.cityEventTimes().length){
			return;
		}
		nextCityEventTime = this.cityEventTimes()[currentCityIndex+1];
		var eventDuration = nextCityEventTime - eventTime;

		var datas =[];
		ncx = this.translates()[0][0];
		ncy = this.translates()[0][1];
		if(this.citiesDisplay().length==0){
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

		ctx = this.translates()[currentCityIndex][0];
		cty = this.translates()[currentCityIndex][1];
		ncx = this.translates()[currentCityIndex+1][0];
		ncy = this.translates()[currentCityIndex+1][1];
		datas = [{x:ctx,y:cty},{x:ncx,y:ncy}];
		circle
		.attr("cx", ctx)
		.attr("cy", cty)
		.transition()
		.duration(eventDuration)
		.ease(EASE_FUNCTION)
		.attr("cx", ncx)
		.attr("cy", ncy);

		appendPath(datas);
		var totalLength = pathMove.node().getTotalLength();
		pathMove
		.attr("stroke-dasharray", totalLength + " " + totalLength)
		.attr("stroke-dashoffset", totalLength)
		.transition()
		.duration(eventDuration)
		.ease(EASE_FUNCTION)
		.attr("stroke-dashoffset", 0)
		.attrTween("point", translateAlong(pathMove.node()));
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

		// append a new path on the map
		function appendPath(datas){
			pathMove= g.append("path")
			.attr("id","animationPath")
			.attr("d", line(datas))
			.attr("stroke", "blue")
			.attr("stroke-width", 2)
			.style("fill", "none");
		}
	};

	// resume from pause
	this.resumePathMove = function(eventDur){
		if(pausedX===-1)return;
		var dur = eventDur*(lineDistance({x:pausedX,y:pausedY},{x:ncx, y:ncy})/lineDistance({x:ctx,y:cty},{x:ncx,y:ncy}));
		pathMove
		.transition()
		.duration(dur)
		.ease("cubic-out")
		.attr("stroke-dashoffset", 0);
		//.delay(currentCityEventTime==null ? 0: ANIMATION_DELAY*this.cityEventTimes(this.expl)[0]);
		circle
		.transition()
		.duration(dur)
		.ease("cubic-out")
		.attr("cx", ncx)
		.attr("cy", ncy);
	};

	// pause
	this.pause = function(){
		if(this.citiesDisplay().length==0)return;
		d3.selectAll("#circle-move").transition()
		.duration(0);

		d3.selectAll("#animationPath").transition()
		.duration(0);
	};

	this.unload = function(){
		if(!this.citiesDisplay())return;
		d3.select("path#path-play").remove();
		d3.selectAll("#circle").remove();
		d3.selectAll("#circle-move").remove();
		d3.selectAll("#animationPath").remove();
		this.resetText();
	};

	this.reset = function(){
		pausedX = -1;
		pausedY = -1;
		if(this.citiesDisplay(this.expl).length==0)return;
		d3.selectAll("#animationPath").remove();
		circle
		.attr("cx", this.translates()[0][0])
		.attr("cy", this.translates()[0][1]);
		this.resetText();
		//currentCityIndex = -1;
	};

	function getTranslate(data){
		var translationX = data.slice(data.indexOf("translate(")+10, data.indexOf(","));
		var translationY = data.slice(data.indexOf(",")+1, data.indexOf(")"));
		return [parseFloat(translationX), parseFloat(translationY)];
	}

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
function lineDistance( point1, point2 ){
	var xs = 0;
	var ys = 0;
	xs = point2.x - point1.x;
	xs = xs * xs;
	ys = point2.y - point1.y;
	ys = ys * ys;

	return Math.sqrt( xs + ys );
}

function appendCircle(){
	circle = g.append("circle")
	.attr("r", 5)
	.style("stroke", "gray")
	.style("fill","red")
	.attr("id", "circle-move")
	.attr("cx", pathMove.translates()[0][0])
	.attr("cy", pathMove.translates()[0][1]);
}
