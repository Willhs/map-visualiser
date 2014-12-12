//-------------- event handling for DOM elements ----------------
/*p
// paths
var goToCity = document.getElementById("go-to-city");
goToCity.addEventListener("click", function () { goToLoc(document.getElementById('city-list').value); });
document.getElementById("add-to-path").onclick = function () { addToPath(document.getElementById('city-list').value); }
document.getElementById("remove-from-path").onclick = function () { removeFromPath(getSelectedInPath(document.getElementById('path-list'))); }
document.getElementById("follow-path").onclick = function () { followPath(0); }
document.getElementById('save-path').onclick = function () { savePath(); }

document.getElementById("upload-path").addEventListener('change', function () {
	handlePathUpload(document.getElementById("upload-path").files[0]);
}, false);*/

//explorations
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

//annotations
function makeAnnotationInput(container){
	var annInput = document.createElement("input");
	annInput.type = "text";
	annInput.placeholder = "Add annotation";

	annInput.onkeydown = function(event) { // if enter is pushed, submit the annotation
		if (event.keyCode === 13) submitAnnotation(annInput.value);
	}
	container.appendChild(annInput);
	annInput.focus();
}

//users
var users = ["obama", "john", "lorde", "will"];

users.forEach(function(userName){
	document.getElementById(userName).onclick= function() {setButtonAndSetUser(userName);}
});

document.getElementById("submit-userName").onclick = function(){
	checkUsersName(document.getElementById("userName-input").value, currentUser.userImage);
}

document.getElementById("submit-message").addEventListener('click',function(){

	var userLabelValue = document.getElementById("userId").value;
	console.log("userID: "+userLabelValue);
	if(userLabelValue!=null){
		saveFileToSharedUser(userLabelValue);
	}
});
document.getElementById("notification").addEventListener('click',function(){
	showListNotifications();
});

