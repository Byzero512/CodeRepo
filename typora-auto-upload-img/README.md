1. # typora-auto-upload-img

2. > auto upload img to server when CTRL+V



### pre

fork from https://github.com/Thobian/typora-plugins-win-img



### install

1. copy the directory 'plugins/'  into  Typora/resources/app/
2. open Typora/resources/app/window.html, and modify it like:

```html
<!-- search code below -->
<script src="./app/window/frame.js" defer="defer"></script>
<!-- add code below  -->
<script src="./plugins/image/upload.js" defer="defer"></script>
```

3. configure your server information in 'plugins/image/upload.js'



### usage

1. When you paste an img into typora, it will auto upload to server
2. If upload failed, the picture in typora will be rendered with background-color (\#d51717), then you can click the img, it will try to upload again.