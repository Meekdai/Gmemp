let musicPlayer = document.createElement('audio');
let playNum=0;
let updateTimer;

let media="https://cdn.jsdelivr.net/gh/Meekdai/Gmemp@main/media/"
let requestJson="https://cdn.jsdelivr.net/gh/Meekdai/Gmemp@main/memp.json"
let request=new XMLHttpRequest();
request.open("GET",requestJson);
request.responseType='text';
request.send();
request.onload=function(){
    jsonData=JSON.parse(request.response);
    console.log(jsonData);
    loadMusic(playNum);
}

function loadMusic(playNum) {
    clearInterval(updateTimer);
    resetValues();
    musicPlayer.src = encodeURI(media+track_list[track_index].mp3);
    musicPlayer.load();

    track_art.style.backgroundImage = "url(" +media+ encodeURI(track_list[track_index].pic) + ")";

}

function resetValues() {

}
