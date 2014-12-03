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

// users
var user1Button = document.getElementById('user1');
user1Button.onclick = function(){users.push(new user("user1"));};

// annotations
var annInput = document.getElementById("annotation-input");
document.getElementById("submit-annotation").onclick = function() { addAnnotation(annInput.value); }