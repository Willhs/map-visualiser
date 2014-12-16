// code from https://github.com/samdutton/simpl/blob/master/getusermedia/sources/js/main.js
// and       ~/projects/web/audio-recorder/public/js/main.

// select elem for audio devices
var audioSelect = document.querySelector("#audioSource");

navigator.getUserMedia = navigator.getUserMedia ||
navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {
    var canvas = document.getElementById( "wavedisplay" );

    drawBuffer( canvas.width, canvas.height, canvas.getContext('2d'), buffers[0] );

    // the ONLY time gotBuffers is called is right after a new recording is completed - 
    // so here's where we should set up the download.
    audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {
    var reader = new FileReader();
    reader.addEventListener("loadend", sendAudio);
    reader.readAsBinaryString(blob);

    function sendAudio(){
        var audioString = reader.result;
        // add to current recording
    }
}

function toggleRecording( e ) {
    if (e.classList.contains("recording")) {
        // stop recording
        audioRecorder.stop();
        e.classList.remove("recording");
        audioRecorder.getBuffers( gotBuffers );
    } else {
        // start recording
        if (!audioRecorder)
            return;
        e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
    }
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