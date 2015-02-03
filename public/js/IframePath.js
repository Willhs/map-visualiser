//init when load the map
function IframePath(){
	var minimap = d3.select("body").append("div")
	.attr("id", "minimap");
	var minimapDiv = minimap.append("div")
	.attr("id","minimap-div");
	var ifrm = minimapDiv.append("iframe")
	.attr("id","iframe")
	.attr("name", "iframe")
	.attr("src", "http://localhost:3000/");

	var gg = $("#iframe").contents().find("#map_area");
//	console.log(gg);
//	$().ready(function(){
//	$("#iframe").ready(function () { //The function below executes once the iframe has finished loading
//	$('some selector', frames['iframe'].document).doStuff();
//	});
//	})
	var pathLine1 = null;
	var line1 = null;
	this.expl = selectedExploration;
	this.citiesDisplay = function(){
		if(selectedExploration==null)return;
		var cities=[];
		selectedExploration.events.forEach(function(event){
			if(event.type.localeCompare("travel")==0){
				cities.push(event.body);
			}
		});
		return cities;
	}
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

//	get the set of cities event time
	this.cityEventTimes = function(){
		times = [];
		selectedExploration.events.forEach(function(event){
			if(event.type === "travel"){
				times.push(event.time);
			}
		});
		return times;
	};

	this.load = function(){
		if(this.citiesDisplay().length==0)return;
		pathLine1 =gg.append("path")
		.data([this.translates()])
		.attr("id","path-play")
		.attr("stroke-dasharray","4,4")
		.attr("d", d3.svg.line()
				.tension(0));
		console.log(gg);
		appendCircle(gg);
		gg.selectAll(".place")
		.data(this.translates())
		.enter().append("circle")
		.attr("id", "circle")
		.attr("r",4)
		.attr("transform", function(d) { return "translate(" + d + ")"; });
		pathMove.setText();
		appendCircle(gg);
		goToLoc(this.citiesDisplay()[0]);

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
				if(this.expl.events[j].type ==="travel" &&
						this.expl.events[j].body===this.citiesDisplay()[i] && eventTime ===
							cityEventTimes[i]){
					index = i;
					return index;
				}
			}
		}
		return null;
	};
}