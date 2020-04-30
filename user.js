// ==UserScript==
// @name        学堂云搜题工具
// @namespace   Violentmonkey Scripts
// @match       https://hfut.xuetangx.com/*
// @version     3.2
// @author      lgf133214
// @grant       GM_xmlhttpRequest
// @require     https://apps.bdimg.com/libs/jquery/2.1.1/jquery.min.js
// @require     https://cdn.bootcss.com/blueimp-md5/2.10.0/js/md5.js
// @description 2020/3/27 下午12:01:48
// ==/UserScript==

// 自定义时间参数，不推荐更改
let settings = {
    timeout: 30e3, // 题库响应等待时间，默认30s， 不必修改
    requestInterval: 1.5e3, // 1500ms 请求间隔
    // 注意，考虑到每次间隔一致可能会太过明显，所以在下面间隔的基础上加了随机数，0-2 s
    clickLoopInterval: 2200, //2200ms 点击事件查询间隔，一次打一个，必须大于2s，否则极易造成请求失败，浪费资源，自动打勾默认关闭
};

// 失败重试列表
let retry = [];

// 左侧栏跳转提示
let lpanel = $('<div>', {
    html: "按s查询答案<br><br>为了减轻题库压力，目前使用自己的服务器中转（单核服务器，如果你们太给力那就。。。），对访问进行了限制。这些只是基于个人兴趣，如果你要完全依赖脚本的话，那只能祝你好运。"+
  "<br><br>如果不行，自己找接口，再不行。。。I don't know<br>觉得有用？<a href='https://s1.ax1x.com/2020/04/22/JUaB11.png' "+
  "target='_blank'>微信赞助</a>/<a href='https://s1.ax1x.com/2020/04/22/JUaD6x.png' target='_blank'>支付宝</a>",
    id: "retry",
    style: "position:fixed;z-index:9999;width: 200px;background-color: greenyellow;top:100px;left:0px;opacity: 0.7;color: purple;"
});
lpanel.appendTo('body');

// 右侧边栏操作提示
let rpanel = $('<div>', {
    html: "<strong>不看是傻逼==>>考试使用请提前做好暴毙的准备，不背锅</strong><br>" +
        "<br>修改日期：2020/4/22 之后看心情（目前是基于兴趣）<br>搜出的答案不完全可信！！！需要自己核实<br>" +
        "如果<i style='color: red'>满足不了你的需求</i>，请<i style='color: red'>另寻他路</i>" +
        "<br><br><br>提示：<br>加载完成后按 s 查询答案，按 n 开/关 自动点击<br><a href='http://jk.fm210.cn' target='_blank'>题库1</a>" +
        "<br><a href='http://do.71kpay.com/' target='_blank'>题库2</a>" +
        "<br><a href='http://100wangke.com/' target='_blank'>题库3(找不到答案的手动去这几个里搜)</a><br>" +
        "<br><br>成功：<span></span> 个<br>自动点击：<em>关闭</em>",
    style: "position:fixed;z-index:9999;width: 200px;background-color: greenyellow;top:100px;right:0px;opacity: 0.7;color: purple;"
});
rpanel.appendTo('body');

// 点击事件，每次点击都是一次请求，mmp
let clickList = [];

// 是否全部查询成功
let successNum = 0;
let allNum = 0;

let nChange = 0;

// 避免重复发送
let submit = false;
let retryed = false;

// 开启点击
let autoClick = false;

// title 页面标识
let title = $('.title').text();

// 初始化函数
function init() {
    title = $('.title').text();
    autoClick = false;
    retry = [];
    submit = false;
    successNum = 0;
    allNum = 0;
    nChange = 0;
    clickList = [];
    lpanel.html('按s查询答案');
    rpanel.html("<strong>不看是傻逼==>>考试使用请提前做好暴毙的准备，不背锅</strong><br>" +
        "<br>修改日期：2020/4/22 之后看心情（目前是基于兴趣）<br>搜出的答案不完全可信！！！需要自己核实<br>" +
        "如果<i style='color: red'>满足不了你的需求</i>，请<i style='color: red'>另寻他路</i>" +
        "<br><br><br>提示：<br>加载完成后按 s 查询答案，按 n 开/关 自动点击<br><a href='http://jk.fm210.cn' target='_blank'>题库1</a>" +
        "<br><a href='http://do.71kpay.com/' target='_blank'>题库2</a>" +
        "<br><a href='http://100wangke.com/' target='_blank'>题库3(找不到答案的手动去这几个里搜)</a><br>" +
        "<br><br>成功：<span></span> 个<br>自动点击：<em>关闭</em>");
}

// s n 按键事件
$(window).keydown(function (event) {
    switch (event.key) {
        case 'n':
            autoClick = !autoClick;
            nChange++;
            if (autoClick) {
                clickLoop();
            } else {
                rpanel.find('em').text("关闭");
            }
            return false;
        case 's':
            // 查询事件
            // 新页面.
            // TODO: .title类名是否改变
            if ($('.title').text() != title)
                init();

            // 主体只需要提交一次即可，其余就是处理失败请求
            if (retry.length == 0 && submit) {
                alert("没有请求可以发了");
                return false;
            }
            lpanel.html("已开始查询，长时间无反应请刷新重试，或脚本失效");
            if (retry.length == 0 && !submit) {
                // 主体请求
                // TODO: 点位1重要，lis是题目 li 的列表
                let lis = $('.paper-list>li');
                // 主体页面没有加载完
                if (lis.length == 0) {
                    lpanel.html("还没加载完，请重试");
                    alert("还没加载完，请重试");
                    return false;
                }
                // 加载完成后获取总长度
                allNum = lis.length;
                // 标志位-主体请求已发出
                submit = true;
                (async () => {
                    for (let i = 0; i < lis.length; i++) {
                        // TODO: 点位2重要，获取li中的题目信息
                        let question = $(lis[i]).find('span.content').text();
                        // 建立好每个 li 的提示信息容器
                        $(lis[i]).attr("id", "li" + i);
                        $(lis[i]).append($('<div>', {
                            id: "div" + i,
                        }));
                        // 查询
                        post(question, lis[i]);
                        await sleep(settings.requestInterval);
                    }
                })();
            } else if (!retryed) {
                retryed = true;
                // 失败重试
                (async () => {
                    for (let i = 0; i < retry.length; i++) {
                        // TODO: 同上
                        let question = $(retry[i]).find('span.content').text();
                        post(question, retry[i]);
                        await sleep(settings.requestInterval);
                    }
                    retryed = false;
                })();
            }
    }
});

// 发请求
function post(question, li) {
    // 提示信息容器
    let div = $(li).find('#div' + $(li).attr("id").substring(2));
    GM_xmlhttpRequest({
        method: 'POST',
        url: 'http://47.100.91.114:8986',
        data: 'question=' + encodeURI(question),
        // 超时时间 30s
        timeout: settings.timeout,
        onload: function (xhr) {
            // 200 且不为空
            if (xhr.status == 200 && xhr.responseText != '') {
                let obj = $.parseJSON(xhr.responseText) || {};
                let tm = obj['question'] || "";
                let da = obj['answer'] || "";
                if (da == "") {
                    div.html("问题：<span style='color: mediumpurple'>" + "找不到答案，请自行搜索解决" + '</span><br>' +
                        '答案：' + "<span style='color: green'>" + da + '</span>'
                    );
                    if (retry.indexOf(li) == -1) {
                        retry.push(li);
                        updatelist();
                    }
                    return;
                }
                div.html("问题：<span style='color: mediumpurple'>" + tm + '</span><br>' +
                    '答案：' + "<span style='color: green'>" + da + '</span>'
                );
                // 点击事件入列
                clickList.push(click(li, da));
                successNum++;
                rpanel.find('span').text(successNum);
                // 去除失败查询
                if (retry.indexOf(li) != -1) {
                    retry.splice(retry.indexOf(li), 1);
                    updatelist();
                }
                // 所有请求都成功提示
                if (successNum == allNum) {
                    lpanel.html("查询结束，请自行检查");
                }
            } else {
                // 错误响应提示
                div.html("<span style='color: red'>响应错误，请稍后重试</span>");
                if (retry.indexOf(li) == -1) {
                    retry.push(li);
                    updatelist();
                }
            }
        },
        ontimeout: function () {
            div.html("<span style='color: red'>超时，请稍后重试</span>");
            if (retry.indexOf(li) == -1) {
                retry.push(li);
                updatelist();
            }
        }
    });
}

// 更新左侧边栏
function updatelist() {
    lpanel.html("失败 " + retry.length + "个，结束后按s重试");
    retry.forEach(function (value, index, array) {
        let a = $('<a>', {
            html: '<br>第 ' + eval($(value).attr('id').substring(2) + '+1') + '题， 点击查看',
            href: "#" + $(value).attr('id'),
        });
        lpanel.append(a);
    })
}

// 点击事件
function click(li, answer) {
    return function () {
        // TODO: 获取点击选项，次要
        let choices = $(li).find('.answer-info');
        for (let i = 0; i < choices.length; i++) {
            // TODO: 是不是多选
            if ($(li).find('.type').text().replace(" ", '') == '多选') {
                if (answer.indexOf($(choices[i]).text().replace(" ", '')) != -1) {
                    if (!$(choices[i]).find('input').prop("checked")) {
                        $(choices[i]).click();
                        return true;
                    }
                } else {
                    if ($(choices[i]).find('input').prop("checked")) {
                        $(choices[i]).click();
                        return true;
                    }
                }
            } else {
                // 单选和选择
                if (answer == $(choices[i]).text().replace(" ", '')) {
                    if (!$(choices[i]).find('input').prop("checked")) {
                        $(choices[i]).click();
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

// 执行点击事件
async function clickLoop() {
    rpanel.find('em').text('点击中。。。');
    while (autoClick) {
        let tmp = nChange;
        let flag = false;
        for (let i = 0; i < clickList.length; i++) {
            if (clickList[i]()) {
                flag = true;
                break;
            }
        }
        if (!flag) {
            rpanel.find('em').text("结束，一定检查！！！  已关闭自动点击");
            $(document).scrollTop(0);
            autoClick = false;
            return false;
        }
        await sleep(settings.clickLoopInterval + (100 * Math.random() >> 0) * 20);
        if (tmp != nChange)
            return false;
    }
}

const sleep = (timer) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timer);
    });
};
