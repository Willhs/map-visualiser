// -------------- event handling for DOM elements ----------------

var goToCity = document.getElementById("go-to-city");
goToCity.addEventListener("click", function () { goToLoc(document.getElementById('cityList').value); });

// events for html elements.
document.getElementById("add-to-path").onclick = function () { addToPath(document.getElementById('cityList').value); }
document.getElementById("remove-from-path").onclick = function () { removeFromPath(getSelected(document.getElementById('pathList'))); }
document.getElementById("follow-path").onclick = function () { followPath(0); }
document.getElementById('save-path').onclick = function () { savePath(); }

var resetExplButton = document.getElementById("reset-button");
resetExplButton.onclick = resetExplButtonFunction;

document.getElementById("upload-path").addEventListener('change', function () {

	handlePathUpload(document.getElementById("upload-path").files[0]);}, false);

document.getElementById("load-exploration-button").addEventListener('change', loadExplButtonFunction, false);

var recordExplButton = document.getElementById("record-button");
recordExplButton.addEventListener("click", startRecording);

var stopExplButton = document.getElementById("stop-button")
stopExplButton.addEventListener('click', stopRecording);

var playExplButton = document.getElementById("play-exploration-button");
playExplButton.addEventListener('click', function () {
	if(record.isEmpty()) alert("Record before replay!")
	d3.select("#record-border").remove();
	d3.select("#record-circle").remove();
	playRecording();
});

var saveExplButton = document.getElementById('save-exploration-button');
saveExplButton.onclick = saveExplButtonFunction;