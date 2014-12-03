// -------------- event handling for DOM elements ----------------

var goToCity = document.getElementById("go-to-city");
goToCity.addEventListener("click", function () { goToLoc(document.getElementById('city-list').value); });

// paths
document.getElementById("add-to-path").onclick = function () { addToPath(document.getElementById('city-list').value); }
document.getElementById("remove-from-path").onclick = function () { removeFromPath(getSelectedInPath(document.getElementById('path-list'))); }
document.getElementById("follow-path").onclick = function () { followPath(0); }
document.getElementById('save-path').onclick = function () { savePath(); }

document.getElementById("upload-path").addEventListener('change', function () {
	handlePathUpload(document.getElementById("upload-path").files[0]);
}, false);

// explorations
var resetExplButton = document.getElementById("reset-button");
resetExplButton.onclick = resetExplButtonFunction;

document.getElementById("load-exploration-button").addEventListener('change', loadExplButtonFunction, false);

var recordExplButton = document.getElementById("record-button");
recordExplButton.addEventListener("click", startRecording);

var stopExplButton = document.getElementById("stop-button")
stopExplButton.addEventListener('click', stopRecording);

var playExplButton = document.getElementById("play-exploration-button");
playExplButton.addEventListener('click', function () {
	if(record.isEmpty()) { alert("Record before replay!"); }
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();
	playRecording();
});

var saveExplButton = document.getElementById('save-exploration-button');
saveExplButton.onclick = saveExplButtonFunction;


// annotations
var annInput = document.getElementById("annotation-input");
document.getElementById("submit-annotation").onclick = function() { addAnnotation(annInput.value); }

// users
var user1Button = document.getElementById('obama');
user1Button.onclick = function(){

	setButtonBorderColorOff('obama');
	user1Button.style.borderColor = "red";
	userInfo.setUser('obama');
	userInfo.setImage(getElementBySrc("obama"));
	};

var user2Button = document.getElementById('john');
user2Button.onclick = function(){
	setButtonBorderColorOff('john');
	user2Button.style.borderColor = "red";
	userInfo.setUser('john');
	userInfo.setImage(getElementBySrc("john"));
	};
var user3Button = document.getElementById('lorde');
user3Button.onclick = function(){

	setButtonBorderColorOff('lorde');
	user3Button.style.borderColor = "red";
	userInfo.setUser('lorde');
	userInfo.setImage(getElementBySrc("lorde"));
	};
var user4Button = document.getElementById('will');
user4Button.onclick = function(){

	setButtonBorderColorOff('will');
	user4Button.style.borderColor = "red";
	userInfo.setUser('will');
	userInfo.setImage(getElementBySrc("will"));
	};

function getElementBySrc(id){
	var src = document.getElementById(id).src;
  return src;
}
function setButtonBorderColorOff(name){
	for(var i = 0; i< buttons.length; i++){
		if(name != buttons[i])
			document.getElementById(buttons[i]).style.borderColor = "black";
	}
}
var buttons = ['obama','john','lorde','will'];
