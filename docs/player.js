let media="https://cdn.jsdelivr.net/gh/Meekdai/Gmemp@main/media/"

// Cache references to DOM elements.
let elms = ['track','artist', 'timer', 'duration','post', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'postBtn', 'waveBtn', 'volumeBtn', 'progress', 'progressBar','waveCanvas', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

let player;
let playNum=0;
let requestJson="memp.json"
// let requestJson="https://music.meekdai.com/memp.json"

let request=new XMLHttpRequest();
request.open("GET",requestJson);
request.responseType='text';
request.send();
request.onload=function(){
    jsonData=JSON.parse(request.response);
    console.log(jsonData);

    if(window.location.hash!=''){
      try{
          playNum=parseInt(window.location.hash.slice(1));
      }
      catch{
          playNum=jsonData.length-1 //默认最近添加的
      }
  }
  else{playNum=jsonData.length-1} //默认最近添加的

    player = new Player(jsonData);
}

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
let Player = function(playlist) {
  this.playlist = playlist;
  this.index = playNum;

  // Display the title of the first track.
  track.innerHTML =  playlist[this.index].title;
  artist.innerHTML =  playlist[this.index].artist;
  document.querySelector("body").style.backgroundImage = "url('" +media+ encodeURI(playlist[this.index].pic) + "')";
  post.innerHTML = '<p><b>'+playlist[this.index].date+'</b></p>' + playlist[this.index].article;
  document.querySelector('meta[property="og:image"]').setAttribute('content', media+ encodeURI(playlist[this.index].pic));

  // Setup the playlist display.
  playlist.forEach(function(song) {
    let div = document.createElement('div');
    div.className = 'list-song';
    div.id = 'list-song-'+playlist.indexOf(song);
    div.innerHTML = song.title + ' - ' + song.artist;
    div.onclick = function() {
      player.skipTo(playlist.indexOf(song));
    };
    list.appendChild(div);
  });
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    let self = this;
    let sound;

    index = typeof index === 'number' ? index : self.index;
    let data = self.playlist[index];

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: [media + data.mp3],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          progressBar.style.display = 'block';
          pauseBtn.style.display = 'block';
        },
        onload: function() {
          // Start the wave animation.
          progressBar.style.display = 'block';
          loading.style.display = 'none';
        },
        onend: function() {
          // Stop the wave animation.
          self.skip('next');
        },
        onpause: function() {
          // Stop the wave animation.
          progressBar.style.display = 'none';
        },
        onstop: function() {
          // Stop the wave animation.
          progressBar.style.display = 'none';
        },
        onseek: function() {
          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // If we are using the Media Session API, set up the metadata and actions.
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: data.title,
        artist: data.artist,
        album: '',
        artwork: [
          { src: media + encodeURI(data.pic), sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    
      navigator.mediaSession.setActionHandler('play', () => { sound.play(); });
      navigator.mediaSession.setActionHandler('pause', () => { sound.pause(); });
      navigator.mediaSession.setActionHandler('previoustrack', () => { self.skip('next'); });
      navigator.mediaSession.setActionHandler('nexttrack', () => { self.skip('prev'); });
    }

    // Update the track display.
    track.innerHTML = data.title;
    artist.innerHTML =  data.artist;
    post.innerHTML = '<p><b>'+data.date+'</b></p>'+data.article;
    document.title=data.title + " - Gmemp";//显示浏览器TAB栏内容
    document.querySelector("body").style.backgroundImage = "url('" +media+ encodeURI(data.pic) + "')";
    window.location.hash="#"+(index);

    document.querySelector('meta[property="og:title"]').setAttribute('content', data.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', data.article);
    document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href);
    document.querySelector('meta[property="og:image"]').setAttribute('content', media+ encodeURI(data.pic));

    //progressBar 垂直居中
    progressBar.style.margin = -(window.innerHeight*0.3/2)+'px auto'

    document.querySelector('#list-song-'+playNum).style.backgroundColor='';//清除上一首选中
    document.querySelector('#list-song-'+index).style.backgroundColor='rgba(255, 255, 255, 0.1)';//高亮当前播放
    playNum=index;
    
    //https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
    this.analyser=Howler.ctx.createAnalyser();
    this.analyser.fftSize = Math.pow(2, Math.floor(Math.log2((window.innerWidth / 15) * 2)));
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    Howler.masterGain.connect(this.analyser);
    draw();

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  //暂停
  pause: function() {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    let self = this;

    // Get the next track based on the direction of the track.
    let index = 0;
    if (direction === 'next') {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    let self = this;

    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = '0%';

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    let self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    let barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    let self = this;

    // Get the Howl we want to manipulate.
    let sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    let seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  //是否显示歌曲列表
  togglePlaylist: function() {
    let self = this;
    let display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
      if (playlist.style.display=='block'){ //滚动到当前播放歌曲的位置
        let [parentDoc,childDoc]= [list,document.querySelector('#list-song-'+playNum)];
        parentDoc.scrollTop = childDoc.offsetTop - parentDoc.offsetHeight /2 ;
      }

    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  //是否显示文章
  togglePost: function() {
    if(post.style.display=="none"){post.style.display="block";}
    else{post.style.display="none";}
  },

  //是否显示频率
  toggleWave: function() {
    if(waveCanvas.style.display=="none"){waveCanvas.style.display="block";}
    else{waveCanvas.style.display="none";}
  },

  //是否显示音量调节界面
  toggleVolume: function() {
    let self = this;
    let display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  //格式化时间为 M:SS.
  formatTime: function(secs) {
    let minutes = Math.floor(secs / 60) || 0;
    let seconds = (secs - minutes * 60) || 0;
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
});
nextBtn.addEventListener('click', function() {
  player.skip('next');
});
progressBar.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
postBtn.addEventListener('click', function() {
  player.togglePost();
});
waveBtn.addEventListener('click', function() {
  player.toggleWave();
});
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function(event) {
  let per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

let move = function(event) {
  if (window.sliderDown) {
    let x = event.clientX || event.touches[0].clientX;
    let startX = window.innerWidth * 0.05;
    let layerX = x - startX;
    let per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

let canvasCtx=waveCanvas.getContext("2d");

function draw() {
  let HEIGHT = window.innerHeight;
  let WIDTH = window.innerWidth;
  waveCanvas.setAttribute('width', WIDTH);
  waveCanvas.setAttribute('height', HEIGHT);

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  drawVisual = requestAnimationFrame(draw);

  player.analyser.getByteFrequencyData(player.dataArray);

  canvasCtx.fillStyle = "rgba(0,0,0,0)";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  const barWidth = (WIDTH / player.bufferLength);
  let barHeight;
  let x = 0;

  for (let i = 0; i < player.bufferLength; i++) {
    barHeight = player.dataArray[i];

    // canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
    canvasCtx.fillStyle = 'rgba(255,255,255,0.5)';
    canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight/2);

    x += barWidth + 1;
  }
}


document.addEventListener('keyup', function(event) {
  console.log(event.key);
  if (event.key == ' ' || event.key == "MediaPlayPause"){
    if(pauseBtn.style.display == 'none' || pauseBtn.style.display=="") {player.play();}
    else {player.pause();}
  }
  else if(event.key == "MediaTrackNext"){player.skip('next');}
  else if(event.key == "MediaTrackPrevious"){player.skip('prev');}
  else if(event.key == "l"|| event.key === "L"){player.togglePlaylist();}
  else if(event.key == "p"|| event.key === "P"){player.togglePost();}
  else if(event.key == "w"|| event.key === "W"){player.toggleWave();}
  else if(event.key == "v"|| event.key === "V"){player.toggleVolume();}
});

console.log("\n %c Gmemp v3.4.1 %c https://github.com/Meekdai/Gmemp \n", "color: #fff; background-image: linear-gradient(90deg, rgb(47, 172, 178) 0%, rgb(45, 190, 96) 100%); padding:5px 1px;", "background-image: linear-gradient(90deg, rgb(45, 190, 96) 0%, rgb(255, 255, 255) 100%); padding:5px 0;");
