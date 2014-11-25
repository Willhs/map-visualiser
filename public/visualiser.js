
  var width = $(window).width() * 0.8,
      height = $(window).height(),
      centered;

  var active;
  //How far we should scale into a selection
  var SCALE_FACTOR = 1200;
  //How fast we should zoom. Lower numbers zoom faster.
  var ANIMATION_DELAY = 0.8;
  //How large the ping effect should be, in proportion to the height of the screen.
  var PING_SIZE = 0.2;
  //The ease function used for transitioning
  var EASE_FUNCTION = "cubic-in-out";
  //The array of easing functions and zoom speeds to use
  var FROM_TEXT_FILE = [];
  //The constants for the animation delay function to be used in the set easing function
  var FAST = 0.4;
  var SLOW = 2.4;
  //The path to the easing function text file
  var PATH_TO_FILE = "data/functions/easingFunctions20.txt"

  var cities, distances, direction, paths;
  
  var projection = d3.geo.mercator()
        .center([68.0, 48.0])
        .scale(2000)
        .translate([width/2,height/2]);
  
  var path = d3.geo.path().projection(projection)
        .pointRadius(2.5);

  var zoom = d3.behavior.zoom()
        .on("zoom",function() {
        g.attr("transform","translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")")
  });

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "svg_map")
      .call(zoom);

  var g = svg.append("g");

  // Read country outline from file
  d3.json("data/kaz.json", function(error, json) {
    var subunits = topojson.feature(json, json.objects.kaz_subunits);

    // make outline of land mass
    g.append("path")
      .datum(subunits)
      .attr("d", path)
      .attr("class", "kaz_subunit")
      // set colour
      .attr("fill","#D0FA58")
      .attr("stroke", "#FF0040");

  });

  // Add cities
  d3.json("data/kaz_places.json", function(error, json){
    cities = json.features;

    g.selectAll("place")
      .data(cities)
      .enter().append("path")
      .attr("d", path)
      .attr("class", "place")
      .attr("id", function(d, i) {
          return "topo" + i;
      })
      .on("click", cityClicked);

    // Assign labels to cities
    g.selectAll(".kaz_place-label")
        .data(cities)
      .enter().append("text")
        .attr("class", "place-label")
        .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
        .attr("dy", ".35em")
        .text(function(d) { return d.properties.NAME; });

    // Align labels to minimize overlaps
    g.selectAll(".place-label")
      .attr("x", function(d) { return d.geometry.coordinates[0] > -1 ? 6 : -6; })
      .style("text-anchor", function(d) { return d.geometry.coordinates[0] > -1 ? "start" : "end"; });

    //Populate city selector
    for (var i = 0; i < cities.length; i++) {
      var entry = document.createElement("option");
      entry.text = cities[i].properties.NAME;
      entry.value = i;
      document.getElementById("cityList").appendChild(entry);
    }

  });

  //read easing functions and animation delay values
  //from the randomized text file.
  FROM_TEXT_FILE = readEaseFunctions(PATH_TO_FILE);
  calculateRuler();

  // The movement function
  var start = [width / 2, height / 2, height], end = [width / 2, height / 2, height];

  function move(d, cb) {

      callback = function() {
          if (cb) {
              cb();
          }
      };

      if (centered === d){
        return reset();
      }
          
      var b = path.centroid(d);
      var x = b[0],
          y = b[1],
          scale = 200; // the scale at which a country is zoomed to

      end[0] = x;
      end[1] = y;
      end[2] = scale;

      var sb = getRealBounds();
      start = [sb[0][0], sb[0][1], height / d3.transform(g.attr("transform")).scale[0]];

      var center = [width / 2, height / 2],
          i = d3.interpolateZoom(start, end);

      g.transition()
        .duration(i.duration * ANIMATION_DELAY)
        .ease(EASE_FUNCTION)
        .attrTween("transform", function() {
            return function(t) { return transform(i(t)); };
        })
        .each("end", callback);
      
      start = [x, y, scale];
      centered = d;

      function transform(p) {
          //k is the width of the selection we want to end with.
          var k = height / p[2];          
          return "translate(" + (center[0] - p[0] * k) + "," + (center[1] - p[1] * k) + ")scale(" + k + ")";

          
      }
  }

  // A function to reset the map view.
  function reset(){
    //console.log("resetting");
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;

    g.transition()
      .duration(900 * ANIMATION_DELAY)
      .ease(EASE_FUNCTION)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");  

  }

  // A function to set the easing function and animation speed 
  // from the information in the text file.
  function setEaseFunction(index){
    var zoomIn = FROM_TEXT_FILE[index][0];
    var zoomOut = FROM_TEXT_FILE[index][1];
    var speed = FROM_TEXT_FILE[index][2];

    // set the easing function
    if(zoomIn == zoomOut){
      EASE_FUNCTION = zoomIn+"-in-out";
    }else{
      EASE_FUNCTION = zoomIn+"-in"+zoomOut+"-out";
    }

    // set the animation delay
    if(speed == "slow"){
      ANIMATION_DELAY = SLOW;
    }else{
      ANIMATION_DELAY = FAST;
    }
  }

  // A function to start the evaluation process
  function startTest(){
    //create the ste of 15 paths to be followed.
    paths = [ ["Shar", "Ayakoz", "Urzhar"], ["Arys", "Turkistan", "Taraz"], ["Oral", "Bayghanin", "Algha"], 
              ["Komsomolets", "Pavlodar"], ["Zaysan", "Temirtau", "Qarqaraly"], ["Embi", "Bayghanin", "Khromtau"],
              ["Astana", "Qulsary", "Makhambet"], ["Zhanibek", "Oostanay", "Algha"], ["Qazaly", "Shonzhy"], 
              ["Zhangaozen", "Oral", "Atasu"], ["Pavlodar", "Shieli", "Almaty"], ["Esil", "Beyneu", "Ertis"], 
              ["Kishkenekol", "Zaysan", "Otar"], ["Aqtau", "Derzhavinsk", "Qyzylorda"], ["Ushtobe", "Zhanibek", "Astana"],
              ["Ayakoz", "Temirtau", "Fort Shevchenko"], ["Zhanibek", "Rudny", "Embi"], ["Shieli", "Shu", "Zhezqazghan"] ];
    // the actual straight-line distance between start and end points.
    distances = [ 281, 217, 447, 1006, 725, 64, 1483, 756, 1348, 1565, 1005, 543, 1143, 1138, 819, 2339, 847, 410];
    // the direction of motion from starting point to end point.
    direction = ["S", "NEE", "SE", "SEE", "NWW", "NNW", "SWW", "E", "SEE", "NE", "S", "NEE", "SSE", "NEE", "NW", "SWW", "E", "NNE"];

    // execute all paths in sequence.
    //could be implemented better!
    executePath(paths[0], 0, function(){
      executePath(paths[1], 1, function(){
        executePath(paths[2], 2, function(){
          executePath(paths[3], 3, function(){
            executePath(paths[4], 4, function(){
              executePath(paths[5], 5, function(){
                executePath(paths[6], 6, function(){
                  executePath(paths[7], 7, function(){
                    executePath(paths[8], 8, function(){
                      executePath(paths[9], 9, function(){
                        executePath(paths[10], 10, function(){ 
                         executePath(paths[11], 11, function(){
                            executePath(paths[12], 12, function(){
                              executePath(paths[13], 13, function(){
                                executePath(paths[14], 14, function(){
                                  executePath(paths[15], 15, function(){
                                    executePath(paths[16], 16, function(){
                                      executePath(paths[17], 17, function(){
            
                                      });
                                    });
                                  });
                                });
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  // A function that controls the navigation of a single path
  // for the user evaluation
  function executePath(path, index, callback){
    var first = getCityIndex(path[0]);
    var second = getCityIndex(path[1]);
    var third;
    setEaseFunction(index);
    if(path.length == 3){
      third = getCityIndex(path[2]);
      move(cities[first], function(){
        move(cities[second], function(){
          move(cities[third], function(){
            ping(first);
            setTimeout(function(){
              reset();
            }, 1000);
            setTimeout(function(){
              askUser(index);
              if(callback && typeof(callback) === 'function'){
                callback();
              }
            }, 2500);
          });
        });
      });
    }else{
      move(cities[first], function(){
        move(cities[second], function(){
          ping(first);
          setTimeout(function(){
            reset();
          }, 1000);
          setTimeout(function(){
            askUser(index);
            if(callback && typeof(callback) === 'function'){
              callback();
            }
          }, 2500);
        });
      });
    }
  }

  // A function to return the index of a given city
  function getCityIndex(name){
    for(j = 0; j < cities.length; j++){
      if(cities[j].properties.NAME == name){
        return j;
      }
    }
  }

  // A function to control the user data collection
  function askUser(index){
    calculateRuler();
    // get user's indication of distance between start and end points.
    var userDist = prompt("How far did you travel from the start point in Km?");
    if(userDist == null || userDist.length < 1 || isNaN(userDist)){
      //TODO: do something with their answer!
      userDist = "?"; 
    }
    // get user's indication of direction from start to end point.
    var userDir = prompt("What direction are you from the start point (N, S, E, W, NE, NW, SE, SW, NNE, NEE, NNW, NWW, SEE, SSE, SWW, SSW)?");
    if(!checkDirection(userDir)){
      //TODO: do something with their answer!
      userDir = "?";
    }

    // send user input to server
    $.ajax({
        type: 'POST',
        url: "/postdata",//url of receiver file on server
        data: {"userDist":userDist, "actualDist":distances[index], "userDir": userDir, "actualDir":direction[index], "ease_function":EASE_FUNCTION, "speed":ANIMATION_DELAY, "path_taken":paths[index]},
        success: function(response){ console.log(response) }, //callback when ajax request finishes
        dataType: "json" //text/json...
    });
  }

  // reads ease functions from a local text file
  // http://stackoverflow.com/a/14446538/1696114
  function readEaseFunctions(filepath){
    var rawFile = new XMLHttpRequest();
    var fileText = []; // string from the file being read
    rawFile.open("GET", filepath, false);
    rawFile.onreadystatechange = function (){
        if(rawFile.readyState === 4){
            if(rawFile.status === 200 || rawFile.status == 0){
                var allText = rawFile.responseText;
                // alert(allText);
                allText = allText.split(/[\s\n]+/);
                while(allText[0]){
                  fileText.push(allText.splice(0,3));
                }
            }
        }
    }
    rawFile.send(null);
    return fileText;
  }

  function openPath(){
    var rawFile = new XMLHttpRequest();
      var fileText = []; // string from the file being read
      rawFile.open("GET", filepath, false);
      rawFile.onreadystatechange = function (){
        if(rawFile.readyState === 4){
            if(rawFile.status === 200 || rawFile.status == 0){
                var allText = rawFile.responseText;
                // alert(allText);
                allText = allText.split(/[\s\n]+/);
                while(allText[0]){
                  fileText.push(allText.splice(0,3));
                }
            }
        }
      } 
  }
// ==============================================================================================================================

  
  function cityClicked(d){
    move(d);
  }

  // A function that takes you to a city
  function goToLoc(index) {
    move(cities[index]);
  }

  var transitionList = [];
      
  // Remove all cities from the path
  function clearPath() {
    transitionList = [];
  }

  // A function to add a city to the path
  function addToPath(index) {
    city = cities[index];
    transitionList.push(city);
    var entry = document.createElement("option");
    entry.value = index;
    entry.text = city.properties.NAME;
    entry.setAttribute("ondblclick", 'goToLoc(' + index + ')');
    entry.setAttribute("onmouseover", 'ping(' + index + ')');
    document.getElementById('pathList').add(entry, null);
  }

  // A function that removes a city from the path
  function removeFromPath(index) {
    var loc = transitionList.indexOf(cities[index]);
    if (loc > -1) {
        transitionList.splice(loc, 1);
    }
    var pathList = document.getElementById('pathList');
    if (pathList.options.length > 0) {
        pathList.remove(pathList.options.selectedIndex);
    }

  }

  // A function that takes the user through the path
  function followPath(index) {
    if (transitionList.length > index) {
        move(transitionList[index], function() {
            followPath(index + 1);
        });
    }
  }

  // A function that returns the selected city
  function getSelected(elem) {
    console.log(elem);
    console.log(elem.options[elem.selectedIndex]);
    return elem.options[elem.selectedIndex].value;
  }

  //Pings a country on the scren
  function ping(index) {

    if(document.getElementById("ping").checked == true){
      var source = cities[index];

      var center = path.centroid(source);
      var screenvars = getAbsoluteBounds();

      var xdist = Math.abs(center[0] - screenvars[0][0]);
      var ydist = Math.abs(center[1] - screenvars[0][1]);

      var startR = 0;

      //Only adjust radius if the target is off the map
      if ((xdist) > (screenvars[1][0]) || (ydist) > (screenvars[1][1])) {
        if (xdist === 0) {
          //Perfectly vertical alignment
          startR = ydist - (screenvars[1][1]);
        }
        else if (ydist === 0) {
          //Perfectly horizontal alignment
          startR = xdist - (screenvars[1][0]);
        }
        else {

          var xdy = (xdist / ydist);
          var screenRatio = width / height;
          var scaleVar = ((xdy) >= screenRatio) ? (xdist / (Math.abs(xdist - screenvars[1][0]))) : (ydist / (Math.abs(ydist - screenvars[1][1])));
          var dist = Math.sqrt(xdist * xdist + ydist * ydist);

          startR = dist / scaleVar;
        }

      }

        var endR = startR + screenvars[1][1] * PING_SIZE;

        //TODO render circles
        g.append("circle")
          .attr("class", "ping")
          .attr("cx", center[0])
          .attr("cy", center[1])
          .attr("r", startR)
          .transition()
          .duration(750)
          .style("stroke-opacity", 0.25)
          .attr("r", endR)
          .each("end", function() {
              g.select(".ping").remove();
          });
    }
  }

  //Convert the screen coords into data coords
  function getRealBounds() {
    var transforms = d3.transform(g.attr("transform"));

    var tx = transforms.translate[0];
    var ty = transforms.translate[1];
    var sc = height / transforms.scale[1];

    var xcenter = ((width / 2) - tx) / transforms.scale[0];
    var ycenter = ((height / 2) - ty) / transforms.scale[0];

    var xspan = width * sc / SCALE_FACTOR;
    var yspan = height * sc / SCALE_FACTOR;

    return [[xcenter, ycenter], [xspan, yspan]];

  }

  //Convert 
  function getAbsoluteBounds() {
    var transforms = d3.transform(g.attr("transform"));

    var tx = transforms.translate[0];
    var ty = transforms.translate[1];

    var xcenter = ((width / 2) - tx) / transforms.scale[0];
    var ycenter = ((height / 2) - ty) / transforms.scale[0];

    return [[xcenter, ycenter], [(width / 2) / transforms.scale[1], (height / 2) / transforms.scale[1]]];
  }

  // A function to check user direction input is valid
  function checkDirection(userDir){
    if(userDir == null || (userDir != "N" && userDir != "S" && userDir != "E" && userDir != "W" && userDir != "NE" && userDir != "NW" && userDir != "SE" && userDir != "SW" && userDir != "NNE" && userDir != "NEE" && userDir != "NNW" && userDir != "NWW" && userDir != "SSE" && userDir != "SEE" && userDir != "SSW" && userDir != "SWW")){
      return false;
    } else{
      return true;
    }
  }

  // A function to set the value of the scale line.
  function calculateRuler(){
    var worldDistance = getRealBounds()[1][0] * 1;
    var screenDistance = $('svg.svg_map').width() / 2;
    var scale = Math.round((worldDistance / screenDistance) * 200);

    document.getElementById("scale-label").innerHTML = " "+scale+" Km";
  }

  // --- Will's added code:

  // events for html elements.
  document.getElementById("go-to-city").onclick = function () { goToLoc(document.getElementById('cityList').value); }
  document.getElementById("add-to-path").onclick = function () { addToPath(document.getElementById('cityList').value); }
  document.getElementById("remove-from-path").onclick = function () { removeFromPath(getSelected(document.getElementById('pathList'))); }
  document.getElementById("follow-path").onclick = function () { followPath(0); }
  document.getElementById("startEval").onclick = function () { startTest(); }

  //document.getElementById("upload-path").onclick = function () { }

  function loadPath(filepath){
        
  }