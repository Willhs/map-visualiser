//init when load the map
function PathMove(){

	var svg = d3.select("#svg_map");
	var g = svg.select("#map_area");
	var pathLine = null;
	this.exploration = null;
	this.citiesDisplay = function(expl){
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
			if(event.type.localeCompare("travel")==0){
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

		circle = g.append("circle")
		.attr("r", 5)
		.attr("fill","black")
		.attr("id", "circle-move")
		.attr("cx", this.translates(expl)[0][0])
		.attr("cy", this.translates(expl)[0][1]);
		//.attr("transform", "translate(" + this.translates(expl)[0] + ")");
	};

	this.updatePathMove = function(expl, eventTime, eventDuration){
		if(this.citiesDisplay(expl).length==0)return;
		var index = this.cityIndex(this.cityEventTimes(expl),eventTime, expl);
		if(index !=null){
			if(index<this.citiesDisplay(expl).length-1){
				circle.attr("cx", this.translates(expl)[index][0]);
				circle.attr("cy", this.translates(expl)[index][1]);
				circle.transition()
				.duration(eventDuration*ANIMATION_DELAY)
				.ease(EASE_FUNCTION)
				.delay(ANIMATION_DELAY*this.cityEventTimes(expl)[0])
				.attr("cx", this.translates(expl)[index+1][0])
				.attr("cy", this.translates(expl)[index+1][1]);
			}
		}
	};

	this.pause = function(expl, cb){
		if(this.citiesDisplay(expl).length==0)return;
		circle.transition()
		.duration(0)
		.each("end", cb);
	}

	this.unload = function(){
		d3.select("path#path-play").remove();
		d3.select("g").selectAll("circle").remove();
	};

	this.reset = function(expl){
		if(this.citiesDisplay(expl).length==0)return;
		circle.attr("cx", this.translates(expl)[0][0]);
		circle.attr("cy", this.translates(expl)[0][1]);
	}
	function getTranslate(data){
		var translationX = data.slice(data.indexOf("translate(")+10, data.indexOf(","));
		var translationY = data.slice(data.indexOf(",")+1, data.indexOf(")"));
		return [parseFloat(translationX), parseFloat(translationY)];
	}
	this.cityIndex = function(cityEventTime, eventTime, expl){
		var index = null;
		for(var i = 0; i<this.citiesDisplay(expl).length; i++){
			for(var j = 0; j<expl.events.length; j++){
				if(expl.events[j].type ==="travel"&& expl.events[j].body===this.citiesDisplay(expl)[i] && eventTime === cityEventTime[i]){
					index = i;
					return index;
				}
			}
		}
		return null;
	};
}