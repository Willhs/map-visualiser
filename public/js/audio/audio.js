// code from https://github.com/samdutton/simpl/blob/master/getusermedia/sources/js/main.js
// and       ~/projects/web/audio-recorder/public/js/main.

// select elem for audio devices
var audioSelect = document.querySelector("#audioSource");

navigator.getUserMedia = navigator.getUserMedia ||
navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioRecorder = null;

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {
    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {
    // sets the audio of the current user's current exploration
    currentUser.getCurrentExploration().setAudio(blob);
}

function startAudioRecording() {
    // start recording
    if (!audioRecorder)
        return;
    audioRecorder.clear();
    audioRecorder.record();
    displayAudioGraphic();
}

function stopAudioRecording(){
    // stop recording
    if (!audioRecorder)
        return;
    audioRecorder.stop();
    audioRecorder.getBuffers( gotBuffers );
    removeAudioGraphic();
}

// displays an image of a microphone
function displayAudioGraphic(){    
    svg.append("image")
        .attr({
            x: width*0.9,
            y: 20,
            width: 50,
            height: 50, 
            "xlink:href": "data/image/microphone-128.png",
            id: "microphone-graphic"
        });
}

function removeAudioGraphic(){
    svg.select("#microphone-graphic")
        .remove();    
}
// called when sources are confirmed 
function gotSources(sourceInfos) {
    for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        var option = document.createElement("option");
        option.value = sourceInfo.id;
        if (sourceInfo.kind === 'audio') {
            option.text = sourceInfo.label || 'microphone ' + (audioSelect.length + 1);
            audioSelect.appendChild(option);
        } else if (sourceInfo.kind === 'video') {
            option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source: ', sourceInfo);
        }
  }
}

if (typeof MediaStreamTrack === 'undefined'){
    alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
} else {
    MediaStreamTrack.getSources(gotSources);
}

function gotMedia(stream) {
    // makes input, gain and analyser AudioNodes
    var audioInput = audioContext.createMediaStreamSource(stream);
    var gainNode = audioContext.createGain();

    audioInput.connect(gainNode);
    audioRecorder = new Recorder( gainNode );

    var zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    gainNode.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
}

function errorCallback(error){
    console.log("navigator.getUserMedia error: ", error);
}

// sends request to use mic
function start(){
    if (!!window.stream) {
        window.stream.stop();
    }
    var audioSource = audioSelect.value;
    var constraints = {
        audio: {
            optional: [{sourceId: audioSource}]
        }
    };
    navigator.getUserMedia(constraints, gotMedia, errorCallback);
}

audioSelect.onchange = start;

start();