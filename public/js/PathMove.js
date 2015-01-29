//init when load the map
function PathMove(){

	var svg = d3.select("#svg_map");
	var g = svg.select("#map_area");
	var pathLine = null;
	var pathMove= null;
	this.exploration = null;
	this.citiesDisplay = function(expl){
		if(expl==null)return;
		var cities=[];
		expl.events.forEach(function(event){
			if(event.type.localeCompare("travel")==0){
				cities.push(event.body);
			}
		});
		return cities;
	}

	this.translates = function(expl){
		trans = [];
		this.citiesDisplay(expl).forEach(function(cityName){
			var index = getCityIndex(cityName);
			var paths = document.getElementById(index);
			var data = paths.getAttribute('transform');
			var translate = getTranslate(data);
			trans.push(translate);
		});
		return trans;
	};
	this.cityEventTimes = function(expl){
		times = [];
		expl.events.forEach(function(event){
			if(event.type === "travel"){
				times.push(event.time);
			}
		});
		return times;
	};

	this.load = function(expl){
		if(this.citiesDisplay(expl).length==0)return;
		pathLine =g.append("path")
		.data([this.translates(expl)])
		.attr("id","path-play")
		.attr("stroke-dasharray","4,4")
		.attr("d", d3.svg.line()
				.tension(0));
		g.selectAll(".point")
		.data(this.translates(expl))
		.enter().append("circle")
		.attr("id", "circle")
		.attr("r",4)
		.attr("transform", function(d) { return "translate(" + d + ")"; });
		this.setText(expl);


//		circle = g.append("circle")
//		.attr("r", 5)
//		.attr("fill","black")
//		.attr("id", "circle-move")
//		.attr("cx", this.translates(expl)[0][0])
//		.attr("cy", this.translates(expl)[0][1]);

		goToLoc(this.citiesDisplay(expl)[0]);
		//var iframeWindow = new IframePath;
		//iframeWindow.load(expl);
	};
	var currentCityIndex = -1;
	var pausedX = -1;
	var pausedY = -1;
	var currentCityEventTime = null;
	this.updatePathMove = function(expl, eventTime, eventDuration, resumed){
		if(eventTime!=null)currentCityEventTime = eventTime;
		var currentCityIndex = this.cityEventTimes(expl).indexOf(currentCityEventTime);
		if(currentCityIndex>this.cityEventTimes(expl).length-2) return;
		nextCityEventTime = this.cityEventTimes(expl)[currentCityIndex+1];
		eventDuration = nextCityEventTime - currentCityEventTime;
		console.log("eventDuration: "+ eventDuration);
		var datas =[];
		var ncx = -1;
		var ncy = -1;
		var totalLength = -1;
		var nextCityIndex = currentCityIndex+1;
		if(this.citiesDisplay(expl).length==0)return;
		var line = d3.svg.line()
		.x(function(d) {
			return d.x;
		})
		.y(function(d) {
			return d.y;
		});

		if(resumed==true){
			//circle.attr("cx", pausedX);
			//circle.attr("cy", pausedY);
			//if(currentCityIndex+1>this.translates(expl).length-1)return;
			console.log("resumed currentCityIndex: "+ currentCityIndex);

			var ncx = this.translates(expl)[nextCityIndex][0];
			var ncy = this.translates(expl)[nextCityIndex][1];
			datas = [{x:pausedX,y:pausedY},{x:ncx,y:ncy}];

			eventDuration = eventDuration*(lineDistance({x:pausedX,y:pausedY},{x:ncx, y:ncy})/lineDistance({x:this.translates(expl)[currentCityIndex][0],y:this.translates(expl)[currentCityIndex][1]},{x:ncx,y:ncy}));
			console.log(eventDuration);

		}
		else if(resumed==false){
			//currentCityIndex = this.cityIndex(this.cityEventTimes(expl),eventTime, expl, currentCityIndex);
			if(currentCityIndex==null)return;
			var cx = this.translates(expl)[currentCityIndex][0];
			var cy = this.translates(expl)[currentCityIndex][1];
			//circle.attr("cx", cx);
			//circle.attr("cy", cy);
			if(currentCityIndex==this.citiesDisplay(expl).length-1)return;
			var ncx = this.translates(expl)[currentCityIndex+1][0];
			var ncy = this.translates(expl)[currentCityIndex+1][1];
			datas = [{x:cx,y:cy},{x:ncx,y:ncy}];

		}

//		circle.transition()
//		.duration(eventDuration*ANIMATION_DELAY)
//		.ease(EASE_FUNCTION)
//		.delay(ANIMATION_DELAY*this.cityEventTimes(expl)[0])
//		.attr("cx", ncx)
//		.attr("cy", ncy);
		appendPath(datas, currentCityIndex);
		totalLength = pathMove.node().getTotalLength();
		pathMove
		.attr("stroke-dasharray", totalLength + " " + totalLength)
		.attr("stroke-dashoffset", totalLength)
		.transition()
			.duration(eventDuration)
			.ease(EASE_FUNCTION)
			.attr("stroke-dashoffset", 0)
			.attrTween("point", translateAlong(pathMove.node()))
			.delay(resumed ? 0: ANIMATION_DELAY*this.cityEventTimes(expl)[0]);

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
		function appendPath(datas, currentCityIndex){
			pathMove= g.append("path")
			.attr("id","animationPath")
			.attr("d", line(datas))
			.attr("stroke", "blue")
			.attr("stroke-width", 2)
			.attr("fill", "none");
		}

	};

	this.pause = function(expl,cb){
		if(this.citiesDisplay(expl).length==0)return;
//		circle.transition()
//		.duration(0)
//		.each("end", cb);
		pathMove.transition()
		.duration(0);
	//	.each("end");
	};

	this.unload = function(expl){
		if(!this.citiesDisplay(expl))return;
		d3.select("path#path-play").remove();
		d3.select("g").selectAll("circle").remove();
		//for(var i= 0; i< this.citiesDisplay(expl).length; i++){
			d3.selectAll("#animationPath").remove();
		//}
		this.resetText(expl);
	};

	this.reset = function(expl){
		if(this.citiesDisplay(expl).length==0)return;

		//for(var i= 0; i< this.citiesDisplay(expl).length; i++){
		//	console.log("remove"+i);
			d3.selectAll("#animationPath").remove();
		//}

		//circle.attr("cx", this.translates(expl)[0][0]);
		//circle.attr("cy", this.translates(expl)[0][1]);
		this.resetText(expl);
		currentCityIndex = -1;
		elapsedCityEventTime = -1;

	};

	function getTranslate(data){
		var translationX = data.slice(data.indexOf("translate(")+10, data.indexOf(","));
		var translationY = data.slice(data.indexOf(",")+1, data.indexOf(")"));
		return [parseFloat(translationX), parseFloat(translationY)];
	}

	this.cityIndex = function(cityEventTimes, eventTime, expl, currentCityIndex){
		var index = null;
		for(var i = currentCityIndex; i<this.citiesDisplay(expl).length; i++){
			for(var j = 1; j<expl.events.length-1; j++){
				if(expl.events[j].type ==="travel" && expl.events[j].body===this.citiesDisplay(expl)[i] && eventTime === cityEventTimes[i]){
					index = i;
					return index;
				}
			}
		}
		return null;
	};
	this.setTexted = false;
	this.setText = function(expl){
		this.setTexted = true;
		for(var i = 0; i<this.citiesDisplay(expl).length; i++){
			var cityNames = this.citiesDisplay(expl);
			var pathed = false;
			var index = getCityIndex(cityNames[i]);
			var cityText = document.getElementById(index);
			cityText.setAttribute("font-size","9px");
			cityText.setAttribute("fill",'#FF0000');
			cityText.setAttribute("dy" , "1.6em");
			cityText.setAttribute("dx" , "0.3em");
			var subStrCityName = cityText.innerHTML.substr(cityText.innerHTML.length-cityNames[i].length);
			if(cityNames.indexOf(cityText.innerHTML)!==-1){
				cityText.innerHTML = i+ " "+cityNames[i];
			}
			else if(cityNames[i]===(subStrCityName)){
				cityText.innerHTML = cityText.innerHTML.substring(0,cityText.innerHTML.indexOf(subStrCityName))+" "+ i +subStrCityName;
			}



		}
	};
	this.resetText = function(expl){
		this.setTexted = false;
		if(expl===null)return;
		for(var i = 0; i<this.citiesDisplay(expl).length; i++){
			var index = getCityIndex(this.citiesDisplay(expl)[i]);
			var cityText = document.getElementById(index);
			cityText.setAttribute("font-size","12px");
			cityText.setAttribute("fill" , '#000000');
			cityText.setAttribute("dy" , ".35em");
			cityText.setAttribute("dx" , "0em");
			cityText.innerHTML = this.citiesDisplay(expl)[i];
		}
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