//init when load the map
var iframe = document.getElementById("iframe");
function IframePath(){
	var svg = $("iframe#map_area");
	var g = svg;
	console.log();
	var pathLine1 = null;
	var line1 = null;
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
			var paths = iframe.contentWindow.document.getElementById(index);
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


		pathLine1 =g.append("path")
		.data([this.translates(expl)])
		.attr("stroke-dasharray","4,4")
		.attr("d", d3.svg.line()
				.tension(0));
		g.selectAll(".point")
		.data(this.translates(expl))
		.enter().append("circle")
		.attr("r",4)
		.attr("transform", function(d) { return "translate(" + d + ")"; });
		this.setText(expl);


		circle1 = g.append("circle")
		.attr("r", 5)
		.attr("fill","black")
		.attr("cx", this.translates(expl)[0][0])
		.attr("cy", this.translates(expl)[0][1]);


	};
	var currentCityIndex1 = -1;
	this.updatePathMove = function(expl, eventTime, eventDuration, currentEvent){
		currentCityIndex1 = -1;
		if(this.citiesDisplay(expl).length==0)return;
		if(this.cityEventTimes(expl).indexOf(eventTime)<0){
			return;
		}
		if(eventTime==0)return;

		if(currentEvent!=null){
			for(var i = 0; i< this.citiesDisplay(expl).length; i++){
				if(this.citiesDisplay(expl)[i]==currentEvent.body){
					currentCityIndex1 = i;
					return;
				}
			}
		}
		else if(currentEvent==null){
			currentCityIndex1 = this.cityIndex(this.cityEventTimes(expl),eventTime, expl, currentCityIndex1);

		}
		else return;
		if(currentCityIndex1==null)return;
		var totalLength = pathLine1.node().getTotalLength();
		var cx = this.translates(expl)[currentCityIndex1][0];
		var cy = this.translates(expl)[currentCityIndex1][1];
		circle1.attr("cx", cx)
		circle1.attr("cy", cy);
		if(currentCityIndex1==this.citiesDisplay(expl).length-1)return;
		var ncx = this.translates(expl)[currentCityIndex1+1][0];
		var ncy = this.translates(expl)[currentCityIndex1+1][1];
		line1 = g.append("line")
		.transition()
			.duration(eventDuration)
			.ease(EASE_FUNCTION)
			.delay(ANIMATION_DELAY*this.cityEventTimes(expl)[0])
		.attr("x1", cx)
		.attr("y1", cy)
		.attr("x2", ncx)
		.attr("y2", ncy)
		.attr("stroke", "blue")
		.attr("stroke-width", 2)
		.attr("fill", "red");

		circle1.transition()
			.duration(eventDuration*ANIMATION_DELAY)
			.ease(EASE_FUNCTION)
			.delay(ANIMATION_DELAY*this.cityEventTimes(expl)[0])
			.attr("stroke-dashoffset", "0")
			.attr("cx", ncx)
			.attr("cy", ncy);

	};




	this.pause = function(expl, cb){
		if(this.citiesDisplay(expl).length==0)return;
		//currentCityIndex1 = currentCityIndex1+1;
		circle1.transition()
		.duration(0)
		.each("end", cb);
	}

	this.unload = function(expl){

		d3.select("path#path-play").remove();
		d3.select("g").selectAll("circle1").remove();
		d3.select("g").selectAll("line1").remove();
		this.resetText(expl);
	};

	this.reset = function(expl){
		if(this.citiesDisplay(expl).length==0)return;
		d3.select("g").selectAll("line1").remove();
		circle1.attr("cx", this.translates(expl)[0][0]);
		circle1.attr("cy", this.translates(expl)[0][1]);
	}

	function getTranslate(data){
		var translationX = data.slice(data.indexOf("translate(")+10, data.indexOf(","));
		var translationY = data.slice(data.indexOf(",")+1, data.indexOf(")"));
		return [parseFloat(translationX), parseFloat(translationY)];
	}

	this.cityIndex = function(cityEventTimes, eventTime, expl, currentCityIndex1){
		var index = null;
		for(var i = currentCityIndex1; i<this.citiesDisplay(expl).length; i++){
			for(var j = 1; j<expl.events.length-1; j++){
				if(expl.events[j].type ==="travel" && expl.events[j].body===this.citiesDisplay(expl)[i] && eventTime === cityEventTimes[i]){
					index = i;
					return index;
				}
			}
		}
		return null;
	};

	this.setText = function(expl){
		for(var i = 0; i<this.citiesDisplay(expl).length; i++){
			var index = getCityIndex(this.citiesDisplay(expl)[i]);

			var cityText = document.getElementById(index);

			cityText.style.fontSize = "16px";
			cityText.setAttribute("fill",'#FF0000');
			cityText.setAttribute("dy" , ".95em");
			cityText.innerHTML = this.citiesDisplay(expl)[i]+ " "+i;
		}
	};
	this.resetText = function(expl){
		if(expl===null)return;
		for(var i = 0; i<this.citiesDisplay(expl).length; i++){
			var index = getCityIndex(this.citiesDisplay(expl)[i]);
			var cityText = document.getElementById(index);
			cityText.style.fontSize = "12px";
			cityText.setAttribute("fill" , '#000000');
			cityText.setAttribute("dy" , ".35em");
			cityText.innerHTML = this.citiesDisplay(expl)[i];
		}
	};
}
