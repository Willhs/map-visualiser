// code from https://github.com/samdutton/simpl/blob/master/getusermedia/sources/js/main.js
var audioSelect = document.querySelector("#audioSource");

navigator.getUserMedia = navigator.getUserMedia ||
navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

// called when sources are confirmed 
function gotSources(sourceInfos) {
    for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        var option = document.createElement("option");
        option.value = sourceInfo.id;
        if (sourceInfo.kind === 'audio') {
            option.text = sourceInfo.label || 'microphone ' + (audioSelect.length + 1);
            audioSelect.appendChild(option);
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

function successCallback(stream) {
    window.stream = stream; // make stream available to console
}

function errorCallback(error){
    console.log("navigator.getUserMedia error: ", error);
}

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
    navigator.getUserMedia(constraints, successCallback, errorCallback);
}

audioSelect.onchange = start;

start();