(function($){
    // 配置信息
    var setting = {
        //==============重要说明==============
        //文件上传到哪里，取值有：self/tencent/aliyun/upyun/qiniu
        //self指自建的服务器
        //tencent指腾讯云的COS
        //aliyun指阿里云OSS
        //upyun指又拍云（目前暂不支持，sdk弄了半天没好）
        //qiniu指七牛云
        //github
        target:'github',
        
        //target=self 时涉及的配置参数
        self: {
            url: 'http://tools.jiebianjia.com/typora/upload.html',
            //自定义请求头，做校验，防止其他人随意调接口
            headers: {
                token: 'B40289FC92ED660F433BF0DB01577FDE'
            }
        },
        //target=tencent 时涉及的配置参数
        tencent : {
            // 关于腾讯云COS的介绍文档：https://cloud.tencent.com/document/product/436
            // 下面的 SecretId、SecretKey 强烈不建议用你腾讯云主账号的key ，创建一个子用户仅授予API的cos权限
            // 添加子用户链接：https://console.cloud.tencent.com/cam
            // 更多关于腾讯云子用户的介绍：https://cloud.tencent.com/document/product/598/13665
            
            // 必须参数，如果你有自己的腾讯云COS改成自己的配置
            Bucket: 'jiebianjia-1252439934',                    // 对象存储->存储桶列表(存储桶名称就是Bucket)
            SecretId: '111111111111111111111111111111111111',   // 访问控制->用户->用户列表->用户详情->API密钥 下查看
            SecretKey: '11111111111111111111111111111111',      // 访问控制->用户->用户列表->用户详情->API密钥 下查看
            Region: 'ap-guangzhou',                             // 对象存储->存储桶列表(所属地域中的英文就是Region)
            Folder: 'typora',                                   // 可以把上传的图片都放到这个指定的文件夹下

            // 可选参数
            FileParallelLimit: 3,                               // 控制文件上传并发数
            ChunkParallelLimit: 3,                              // 控制单个文件下分片上传并发数
            ChunkSize: 1024 * 1024,                             // 控制分片大小，单位 B
            ProgressInterval: 1,                                // 控制 onProgress 回调的间隔
            ChunkRetryTimes: 3,                                 // 控制文件切片后单片上传失败后重试次数
            UploadCheckContentMd5: true,                        // 上传过程计算 Content-MD5
        },
        //target=aliyun 时涉及的配置参数
        aliyun : {
            // 必须参数，如果你有自己的阿里云OSS改成自己的配置
            SecretId: '111111111111111111111111',               // 需要先创建 RAM 用户，同时访问方式选择“编程访问”，详细帮助文档：https://help.aliyun.com/document_detail/28637.html
            SecretKey: '111111111111111111111111111111',        // 只想说阿里的这个RAM做的还真的有点难以理解和使用
            Folder: 'typora',                                   // 可以把上传的图片都放到这个指定的文件夹下
            BucketDomain : 'http://jiebianjia.oss-cn-shenzhen.aliyuncs.com/', // 存储空间下有个：Bucket 域名 挑一个就好了
            
            policyText: {
                "expiration": "9021-01-01T12:00:00.000Z",       //设置该Policy的失效时间，超过这个失效时间之后，就没有办法上传文件了
                "conditions": [
                    ["content-length-range", 0, 524288]         // 设置上传文件的大小限制 512kb，可以根据自己的需要调整
                ]
            },
        },
        //target=upyun 时涉及的配置参数
        upyun : {
            // 必须参数，如果你有自己的阿里云OSS改成自己的配置
            Username: 'typora',                              // 用户名
            Password: '11111111111111111111111111111111',    // 密码
            Folder: 'typora',                                // 可以把上传的图片都放到这个指定的文件夹下
            Bucket : 'jiebianjia',                           // 存储桶 或者又叫服务名称
            Domain : 'http://v0.api.upyun.com/',             // 智能选路（官方推荐，一般不用改）
        },
        //target=qiniu 时涉及的配置参数
        qiniu : {
            UploadDomain: 'https://upload-z2.qiniup.com',               // 上传地址，需要根据你存储空间所在位置选择对应“客户端上传”地址 详细说明：https://developer.qiniu.com/kodo/manual/1671/region-endpoint
            AccessDomain: 'http://q1701tver.bkt.clouddn.com/',          // 上传后默认只会返回相对访问路径，需要设置好存储空间的访问地址。进入“文件管理”下面可以看到个“外链域名”就是你的地址了。注意保留前面的：http://，以及后面的：/
            AccessKey : '1111111111111111111111111111111111111111',     // AK通过“密钥管理”页面可以获取到，地址：https://portal.qiniu.com/user/key
            SecretKey: '1111111111111111111111111111111111111111',      // SK通过“密钥管理”页面可以获取到，地址：https://portal.qiniu.com/user/key
            Folder: 'typora',                                           // 可以把上传的图片都放到这个指定的文件夹下
            
            policyText: {
                scope: "jiebianjia",                                    // 对象存储->空间名称，访问控制记得设置成公开
                deadline: 225093916800,                                 // 写死了：9102-12-12日，动态的好像偶尔会签名要不过
            },
        },
        //target=github 时涉及的配置参数
        github:{
            Token : '0018b26344dbae85ee04f8d5425592c6246e58eb', // 添加一个仅给typora使用的token 授予最小的权限（repo.public_repo） ，添加token：https://github.com/settings/tokens
            CommitterName : 'Thobian',                          // 提交人昵称，写你github的昵称
            CommitterEmail : 'suixinsuoyu1hao@gmail.com',       // 提交人邮箱，写你github的邮箱
            Repository : 'Thobian/typora-plugins-win-img',      // github项目名，比如你的项目地址是：https://github.com/Thobian/typora-plugins-win-img  那就是后面的“Thobian/typora-plugins-win-img”
            Filepath : 'typora',                                // 图片在项目中的保存目录，可以不用提前创建目录，github提交时发现没有会自动创建
        },
        

        //==============回调函数==============
        // 上传成功
        onSuccess: function(url,element) {
            console.log("upload success");
            var src = element.attr('src');

            element.
                attr('src', url).
                parent('span[md-inline="image"]').
                attr('data-src', url).
                find('.md-image-src-span').
                html(url);

            element.removeAttr("style").removeAttr(locked).removeAttr(is_img_from_paste);
            var fs = reqnode('fs');
            fs.unlinkSync(src.substring(7, src.lastIndexOf('?')));
        },
        // 上传失败
        onFailure: function(text,element) {
            element.attr("style","background-color:#d51717;");
            element.removeAttr(locked);
        }
    };

    var helper = {
        // 将base64转文件流
        base64ToBlob: function(base64) {
            var arr = base64.split(',');
            var mime = arr[0].match(/:(.*?);/)[1] || 'image/png';
            // 去掉url的头，并转化为byte
            var bytes = window.atob(arr[1]);
            // 处理异常,将ascii码小于0的转换为大于0
            var ab = new ArrayBuffer(bytes.length);
            // 生成视图（直接针对内存）：8位无符号整数，长度1个字节
            var ia = new Uint8Array(ab);

            for (var i = 0; i < bytes.length; i++) {
                ia[i] = bytes.charCodeAt(i);
            }

            return new Blob([ab], {
                type: mime
            });
        },
        // 根据base64获取文件扩展名
        extension: function(base64) {
            var ext = base64.split(',')[0].match(/data:image\/(.*?);base64/)[1] || 'png';
            // console.log("the file ext is: "+ext);
            return ext;
        },
        // 根据base64获取图片内容
        content: function(base64) {
            var content = base64.split(',')[1];
            return content;
        },
        mine: function(base64) {
            var arr = base64.split(',');
            var mime = arr[0].match(/:(.*?);/)[1] || 'image/png';
            // console.log("the file mime is: "+mime);
            return mime;
        },
        // 时间格式化函数
        dateFormat: function(date, fmt) {
            var o = {
                "M+": date.getMonth() + 1, //月份
                "d+": date.getDate(), //日
                "H+": date.getHours(), //小时
                "m+": date.getMinutes(), //分
                "s+": date.getSeconds(), //秒
                "q+": Math.floor((date.getMonth() + 3) / 3), //季度
                "S": date.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }
    };

    var init = {
        // 上传到github时的初始化方法
        github: function() {

        }
    };

    // 上传文件的方法
    var upload = {
        // 使用github存储时，适用的上传方法
        github: function(fileData, successCall, failureCall) {
            // console.log(setting.github);
            var filename = helper.dateFormat((new Date()), 'yyyyMMddHHmmss-') + Math.floor(Math.random() * Math.floor(999999)) + '.' + helper.extension(fileData[0]);
            var data = {
                "message": "Upload picture with typora",
                "committer": {
                    "name": setting.github.CommitterName,
                    "email": setting.github.CommitterEmail
                },
                "content": helper.content(fileData[0])
            };
            $.ajax({
                type: "PUT",
                // url: "https://api.github.com/repos/"+setting.github.Repository+"/contents/"+setting.github.Filepath+"/"+filename,
                url: "https://api.github.com/repos/" + setting.github.Repository + "/contents/" + filename,
                async: true,
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                beforeSend: function(request) {
                    request.setRequestHeader("Authorization", "token " + setting.github.Token);
                },
                success: function(data) {
                    successCall(data.content.download_url, fileData[1]);
                },
                error: function(result) {
                    failureCall('Error: Failed to upload!', fileData[1]);
                }
            });
        }
    };


    //读取文件为base64，再回调上传函数将文件发到服务器
    var loadImgAndSend = function(url,element) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();

            reader.onloadend = function() {
                switch (setting.target) {
                    case 'github':
                        upload.github([reader.result,element], setting.onSuccess, setting.onFailure);
                        break;
                    default:
                        setting.onFailure('Error: upload target configure error: ');
                }
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }

    // 核心方法
    var locked = 'doing';
    var is_img_from_paste = "is_img_from_paste";
    var noticeEle = 'image-result-notice';
    $.image = {};
    $.image.init = function(options) {
        options = options || {};
        setting.target = options.target || setting.target;
        setting.self = options.self || setting.self;
        setting.tencent = options.tencent || setting.tencent;
        setting.aliyun = options.aliyun || setting.aliyun;
        setting.qiniu = options.qiniu || setting.qiniu;
        setting.github = options.github || setting.github;

        // 根据不同的文件存储位置，初始化不同的环境
        switch (setting.target) {
            case 'github':
                init.github();
                break;
        }

        // 监听鼠标事件
        // $('#write').on('mouseleave click', 'img', function(e){
        $('#write').on('click', 'img', function(e){
            try{
                console.log("click");
                var src = e.target.src;
                // haved upload to github
                if( /^(https?:)?\/\//i.test(src) ){
                    // console.log('The image already upload to server, url:' + src);
                    return false;
                }
                element = $(e.target);
                if (element.attr(is_img_from_paste)=="1"){
                    var doing = element.attr(locked)=='1';
                    if( doing ){
                        // console.log('uploading...');
                        return false;
                    }else{
                        element.attr(locked, '1');
                    }
                    loadImgAndSend(src,element);
                }
            }
            catch(e){console.log(e);};
        });
        $('#write').on('paste', function (e) {
            try {
                setTimeout(function(){
                    target = $(e.target);
                    if (target.has("img").length>0){
                        element = target.find('img');
                        element.attr(locked, '1');
                        element.attr(is_img_from_paste, '1');
                        src = element.attr("src");
                        loadImgAndSend(src,element);
                    }
                },512);
            }
            catch (e) { console.log(e); };
        });
    };
})(jQuery);

$.image.init();
