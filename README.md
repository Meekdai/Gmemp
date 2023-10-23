# Gmemp

一个纯静态页面设计的音乐播放器，可以完全托管在`Github Pages`上或者其他任意静态服务器（如阿里云OSS）。

- [Demo页面](https://music.meekdai.com/)

![Gmemp](img/demo.jpg)

### 文件说明
1. `docs`文件夹为页面展示html/js/css，`memp.json`文件为歌曲列表。
2. `media`文件夹存放歌曲和背景图片，对应`memp.json`内的`pic`和`mp3`字段。
3. `img`文件夹存放`readme.md`展示用图片。

### 安装
1. 修改`docs/memp.json`为自己的内容，修改`media`文件内的歌曲和图片和`docs/memp.json`对应。
2. 修改`docs/player.js`的第一行`media`变量的地址，指向自己的`media`文件夹地址。为了加速我指向了`CDN`的地址。
3. 上传源码到自己的`Github Pages`或者静态服务器即可。

### 鸣谢
- [howler.js](https://github.com/goldfire/howler.js)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API)


### License

请保留console界面版权信息，谢谢！
