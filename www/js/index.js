/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready

// 定时器
var live_status_interval;
var clear_log_interval;
var room_ids = [];
var usernames = [];
// 存储直播的状态
var all_live_status = [];
// 初始化配置
var init_config = {
    "audio_url" : "file/岩崎元是-発芽.mp3",
    "uids" : ["3709626"],
    "loop_interval" : 10,
    "img_url" : "img/default_bg.jpg"
};
// 本地配置
var local_config = {
    "audio_url" : "file/岩崎元是-発芽.mp3",
    "uids" : ["3709626"],
    "loop_interval" : 10,
    "img_url" : "img/default_bg.jpg"
};

// 睡眠 毫秒
function sleep(delay) {
    let start = +new Date()
    while (+new Date() - start < delay) {}
}

// 判断字符串string末尾是否为 target
function confirmEnding(string, target) {
    if (string.substr(-target.length) === target) {
        return true;
    } else {
        return false;
    }
}

// 更新uid配置
function update_uid_config() {
    room_ids = [];
    usernames = [];
    all_live_status = [];
    var uid_input = document.getElementById("uid_input").value;
    // 判读输入框末尾是否空格，有则去除空格
    if(confirmEnding(uid_input, " ")) {
        uid_input = uid_input.substr(0, uid_input.length - 1);
    }
    local_config["uids"] = uid_input.split(" ");
    log(local_config["uids"]);
    for(var i = 0; i < local_config["uids"].length; i++) {
        all_live_status.push(0);
        print_username(i);
        sleep(100);
        get_room_id(i);
        sleep(100);
    }
}

// 输出uid对应用户昵称
function print_username(index) {
    var username = "-";
    // 构建url
    var url = "https://api.bilibili.com/x/space/acc/info?mid=" + local_config["uids"][index] + "&jsonp=jsonp";
    // 建立所需的对象
    var httpRequest = new XMLHttpRequest();
    // 打开连接  将请求参数写在url中 
    httpRequest.open('GET', url, true);
    // 发送请求  将请求参数写在URL中
    httpRequest.send();
    httpRequest.onerror = function(error) { log("请求info出错！" + error, "error"); };
    httpRequest.ontimeout = function() { log("请求info超时！", "error"); };
    // 获取数据后的处理程序
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            // 获取到json字符串
            var ret = httpRequest.responseText;
            // 转为JSON对象
            var json = JSON.parse(ret);
            // log(json);
            // alert(json);

            if (json.length == 0) {
                log(local_config["uids"][index] + "无数据", "error"); 
                usernames.push(username);
                return;
            }

            if(json["code"] != 0) {
                log(local_config["uids"][index] + "获取用户昵称失败，请检查uid是否正确", "error");
                usernames.push(username);
                return;
            }

            username = json["data"]["name"];
            log("用户名:" + username + " UID:" + local_config["uids"][index]);
            usernames.push(username);
        }
    };
}

// 通过uid获取room_id
function get_room_id(index) {
    var room_id = "";
    // 构建url
    var url = "https://api.live.bilibili.com/room/v2/Room/room_id_by_uid?uid=" + local_config["uids"][index]; 
    // 建立所需的对象
    var httpRequest = new XMLHttpRequest();
    // 打开连接  将请求参数写在url中 
    httpRequest.open('GET', url, true);
    // 发送请求  将请求参数写在URL中
    httpRequest.send();
    httpRequest.onerror = function(error) { log("请求room_id_by_uid出错！" + error, "error"); };
    httpRequest.ontimeout = function() { log("请求room_id_by_uid超时！", "error"); };
    // 获取数据后的处理程序
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            // 获取到json字符串
            var ret = httpRequest.responseText;
            // 转为JSON对象
            var json = JSON.parse(ret);
            // log(json);
            // alert(json);

            if (json.length == 0) {
                log(local_config["uids"][index] + "无数据", "error"); 
                room_ids.push(room_id);
                return;
            }

            if(json["code"] != 0) {
                log(local_config["uids"][index] + "获取房间号失败，请检查uid是否正确", "error");
                room_ids.push(room_id);
                return;
            }

            room_id = json["data"]["room_id"];
            log("房间号:" + room_id + " UID:" + local_config["uids"][index]);
            room_ids.push(room_id);
        }
    };
}

// 开启循环监听live_status
function loop_listen_live_status() {
    for(var i = 0; i < all_live_status.length; i++) {
        // 判断是否已经开播
        if(all_live_status[i] != 1) {
            get_live_status(i);
            sleep(100);
        } else {
            // log("第" + (i + 1) + "个用户已经响铃过，跳过监测");
        }
    }
}

// 获取直播间开播情况
function get_live_status(index) {
    var live_status = 0;
    // 构建url
    var url = "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id="  + room_ids[index];
    //    + "&protocol=0,1&format=0,1,2&codec=0,1";
    // 建立所需的对象
    var httpRequest = new XMLHttpRequest();
    // 打开连接  将请求参数写在url中 
    httpRequest.open('GET', url, true);
    // 发送请求  将请求参数写在URL中
    httpRequest.send();
    httpRequest.onerror = function(error) { log("请求getRoomPlayInfo出错！" + error, "error"); };
    httpRequest.ontimeout = function() { log("请求getRoomPlayInfo超时！", "error"); };
    // 获取数据后的处理程序
    httpRequest.onreadystatechange = function () {
        if (httpRequest.readyState == 4 && httpRequest.status == 200) {
            // 获取到json字符串
            var ret = httpRequest.responseText;
            //console.log(ret);
            // 转为JSON对象
            var json = JSON.parse(ret);
            // log(json);
            // alert(json);

            if (json.length == 0) {
                log(room_ids[index] + "无数据", "error"); 
                return 0;
            }

            live_status = json["data"]["live_status"];
            // 更新直播状态
            if(live_status == 0 || live_status == 1 || live_status == 2) {
                all_live_status[index] = live_status;
            }

            // 1为直播中 0为未开播 2为轮播中
            if(live_status == 1) {
                var audio = document.getElementById('audio_id');
                audio.play();
                log(usernames[index] + " 正在直播中！！！", "warn");
                // clearInterval(live_status_interval);
                // log("闹钟停止运行", "success");

                // 检测屏幕状态
                // cordova.plugins.backgroundMode.isScreenOff(function(bool) {
                //     if(bool == true) log("手机锁屏");
                //     else log("手机未锁屏");
                // });

                // 打开屏幕
                cordova.plugins.backgroundMode.wakeUp();

                // 从后台移动到前台
                cordova.plugins.backgroundMode.moveToForeground();
            }

            return live_status;
        }
    };

    // log("get_live_status() over");

    return 0;
}

// Play audio 插件
//
function playAudio(url) {
    console.log(url);
    log(url);
    // Play the audio file at url
    var my_media = new Media(url,
        // success callback
        function () {
            console.log("playAudio():Audio Success");
            log("playAudio():Audio Success");
        },
        // error callback
        function (err) {
            console.log("playAudio():Audio Error: " + err);
            log("playAudio():Audio Error: " + err);
        }
    );
    // Play audio
    my_media.play();
}

// 自启动运行
function self_start_run() {
    update_uid_config();
    clearInterval(live_status_interval);
    // get_live_status();
    var loop_interval = parseInt(document.getElementById("loop_interval").value);
    live_status_interval = setInterval(function(){loop_listen_live_status()}, (loop_interval * 1000 + get_random(0, 100)));
    log("自启动运行中...", "success");

    local_config["loop_interval"] = loop_interval;
    // WriteDataToFile();
    localStorage.setItem('baseInfo', JSON.stringify(local_config));
    log("写入当前配置数据");
}

// 保存配置
function save_config() {
    var uid_input = document.getElementById("uid_input").value;
    local_config["uids"] = uid_input.split(" ");
    var loop_interval = parseInt(document.getElementById("loop_interval").value);
    local_config["loop_interval"] = loop_interval;

    // WriteDataToFile();
    localStorage.setItem('baseInfo', JSON.stringify(local_config));
    log("写入当前配置数据");
}

// 停止运行
function stop_run() {
    clearInterval(live_status_interval);
    var audio = document.getElementById('audio_id');
    audio.pause();
    log("已停止运行", "success");
}

document.addEventListener('deviceready', function () {
    // new Promise(function (resolve, reject) {
    //     var permissions = cordova.plugins.permissions;
    //     var list = [
    //             permissions.WRITE_EXTERNAL_STORAGE,
    //             permissions.MODIFY_FORMAT_FILESYSTEMS,
    //             permissions.MOUNT_UNMOUNT_FILESYSTEMS
    //             //可以写多个权限
    //         ];
    //         permissions.requestPermissions(list, function(status) {
    //                 log("获取权限成功！" + status, "success");
    //                 resolve(status)
    //             }, function () {
    //                 log("获取权限失败！" + status, "error");
    //                 reject()
    //             })
    // }).then(function(status){
    //     // if(!status.hasPermission) {
    //     //     log("获取权限失败！" + status, "error");
    //     // } else {
    //     //     log("获取权限成功！" + status, "success");
    //     // }

    //     // log(cordova.file, "log");
    //     // log(cordova.file.dataDirectory, "log");
    //     // log(cordova.file.cacheDirectory, "log");

    //     // 打开或创建文件夹,创建文件
    //     createAndWriteFile();

    // }).catch(function () {
    //     //获取权限失败！！！
    //     log("获取权限失败！", "error");
    // });

    // 打开或创建文件夹,创建文件
    // createAndWriteFile();

    // 读取数据
    // getAndReadFile();

    // 从session读取数据
    var temp_json_str = localStorage.getItem('baseInfo');
    if(temp_json_str.length == 0) {
        log("localStorage无配置数据");
        localStorage.setItem('baseInfo', JSON.stringify(init_config));
        log("写入初始配置数据");
    } else {
        log("读取本地配置成功！", "success");
        var json = JSON.parse(temp_json_str);
        local_config = json;
        // var room_ids = [];
        // var usernames = [];
        if(json["audio_url"].length == 0) document.getElementById("audio_id").src = "file/岩崎元是-発芽.mp3";
        else document.getElementById("audio_id").src = json["audio_url"];
        var uid_input = "";
        for(var i = 0; i < json["uids"].length; i++) {
            if(i == (json["uids"].length - 1)) uid_input = uid_input + json["uids"][i];
            else uid_input = uid_input + json["uids"][i] + " ";
        }
        document.getElementById("uid_input").value = uid_input;
        if(json["loop_interval"].length == 0) document.getElementById("loop_interval").value = 10;
        else document.getElementById("loop_interval").value = json["loop_interval"]; 
        if(json["img_url"].length == 0) document.body.style.backgroundImage = 'url(img/default_bg.jpg)';
        else document.body.style.backgroundImage = 'url(' + json["img_url"] + ')';
    }

    // 自启动
    cordova.plugins.autoStart.enable();
    cordova.plugins.autoStart.enableService("APIClock");

    cordova.plugins.backgroundMode.on('enable', function(){
        log("后台运行功能启动", "success");
    });

    // 各种API，如播放媒体或跟踪GPS位置在后台可能无法工作，而在后台，即使后台模式是活跃的。为了解决这些问题，插件提供了一种方法来禁用Android/CrossWalk完成的大多数优化
    cordova.plugins.backgroundMode.on('activate', function() {
        cordova.plugins.backgroundMode.disableWebViewOptimizations();
        // log("disableWebViewOptimizations");
    });

    cordova.plugins.backgroundMode.on('deactivate', function() {
        // log("backgroundMode deactivate", "log");
    });

    // 覆盖Android上的后退按钮，进入后台，而不是关闭应用程序
    cordova.plugins.backgroundMode.overrideBackButton();

    // 设置通知
    cordova.plugins.backgroundMode.setDefaults({
        title: "API闹钟通知",
        text: "有人开播啦",
        icon: 'icon', // this will look for icon.png in platforms/android/res/drawable|mipmap
        color: "F14F4D", // hex format like 'F14F4D'
        resume: true,
        hidden: false,
        bigText: true,
        silent: true // 在静默模式下，插件不会显示通知——这不是默认设置。请注意，Android建议添加通知，否则操作系统可能会暂停应用程序
    });

    // 后台运行功能启动
    cordova.plugins.backgroundMode.enable();

    // 功能按钮
    var func_btn = document.getElementById('func_btn');
    func_btn.onclick = function(){
        document.getElementById("func_div").style.display = "block";
        document.getElementById("set_div").style.display = "none";
    };

    // 设置按钮
    var set_btn = document.getElementById('set_btn');
    set_btn.onclick = function() {
        document.getElementById("func_div").style.display = "none";
        document.getElementById("set_div").style.display = "block";
    };
});

// 配置初始化
function config_init() {
    // WriteDataToFile();
    localStorage.setItem('baseInfo', JSON.stringify(local_config));
    log("写入当前配置数据");

    if(init_config["audio_url"].length == 0) document.getElementById("audio_id").src = "file/岩崎元是-発芽.mp3";
    else document.getElementById("audio_id").src = init_config["audio_url"];
    var uid_input = "";
    for(var i = 0; i < init_config["uids"].length; i++) {
        if(i == (init_config["uids"].length - 1)) uid_input = uid_input + init_config["uids"][i];
        else uid_input = uid_input + init_config["uids"][i] + " ";
    }
    document.getElementById("uid_input").value = uid_input;
    if(init_config["loop_interval"].length == 0) document.getElementById("loop_interval").value = 10;
    else document.getElementById("loop_interval").value = init_config["loop_interval"]; 
    if(init_config["img_url"].length == 0) document.body.style.backgroundImage = 'url(img/default_bg.jpg)';
    else document.body.style.backgroundImage = 'url(' + init_config["img_url"] + ')';
}

// 写入数据到文件
function WriteDataToFile() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
        console.log('打开的文件系统: ' + fs.name);
        fs.root.getDirectory('Documents', {create: true}, function (dirEntry) {
            dirEntry.getDirectory('APIClock', {create: true}, function (subDirEntry) {
                subDirEntry.getFile("baseInfo.json", {create: true, exclusive: false}, function (fileEntry) {
                    fileEntry.name == 'baseInfo.json';
                    fileEntry.fullPath == 'Documents/APIClock/baseInfo.json';
                    log("local_config:" + JSON.stringify(local_config));
                    //文本内容
                    var dataObj = new Blob([JSON.stringify(local_config)], {type: 'text/plain'});
                    //写入文件
                    writeFile(fileEntry, dataObj);
                }, onErrorCreateFile);
            }, onErrorGetDir);
        }, onErrorGetDir);
    }, onErrorLoadFs);
}
 
/*
 * 打开或创建文件夹,创建文件
 * Android:sdcard/Documents/ble目录
 * IOS:cdvfile://localhost/persistent/xbrother/assets目录
 * 文件目录存在则打开,不存在则创建
 * */
function createAndWriteFile() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
        console.log('打开的文件系统: ' + fs.name);
        log('打开的文件系统: ' + fs.name);
        fs.root.getDirectory('Documents', {create: true}, function (dirEntry) {
            dirEntry.getDirectory('APIClock', {create: true}, function (subDirEntry) {
                subDirEntry.getFile("baseInfo.json", {create: true, exclusive: false}, function (fileEntry) {
                    log('createAndWriteFile成功');
                    // fileEntry.name == 'baseInfo.json';
                    // fileEntry.fullPath == 'Documents/APIClock/baseInfo.json';
                    // //文本内容
                    // var str = '{ "audio_url" : "file/岩崎元是-発芽.mp3", "uids" : ["3709626"], "loop_interval" : 10, "img_url" : "img/default_bg.jpg"}';
                    // var dataObj = new Blob([str], {type: 'text/plain'});
                    // //写入文件
                    // writeFile(fileEntry, dataObj);
                }, onErrorCreateFile);
            }, onErrorGetDir);
        }, onErrorGetDir);
    }, onErrorLoadFs);
}
 
/*
* 依次打开指定目录文件夹,读取文件内容
 * Android:sdcard/Documents/APIClock/baseInfo.json
 * IOS:cdvfile://localhost/persistent/xbrother/assets/task.json
* 目录和文件存在则打开,不存在则退出
* */
function getAndReadFile() {
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fs) {
        console.log('打开的文件系统: ' + fs.name);
        log('打开的文件系统: ' + fs.name);
        fs.root.getDirectory('Documents', {create: false}, function (dirEntry) {
            dirEntry.getDirectory('APIClock', {create: false}, function (subDirEntry) {
                subDirEntry.getFile("baseInfo.json", {create: false, exclusive: false}, function (fileEntry) {
                    // console.log("是否是个文件？" + fileEntry.isFile.toString());
                    log("是否是个文件？" + fileEntry.isFile.toString());
                    fileEntry.name == 'baseInfo.json';
                    fileEntry.fullPath == 'Documents/APIClock/baseInfo.json';
                    readFile(fileEntry);
                }, onErrorCreateFile);
            }, onErrorGetDir);
        }, onErrorGetDir);
    }, onErrorLoadFs);
}
 
//将内容数据写入到文件中
function writeFile(fileEntry, dataObj) {
    //创建一个写入对象
    fileEntry.createWriter(function (fileWriter) {
 
        //文件写入成功
        fileWriter.onwriteend = function () {
            log("文件写入成功");
        };
 
        //文件写入失败
        fileWriter.onerror = function (e) {
            log("文件写入失败: " + e.toString(), "error");
        };
 
        //写入文件
        fileWriter.write(dataObj);
    });
}
 
//读取文件
function readFile(fileEntry) {
    fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function () {
            var ret = this.result;
            log("本地配置读取成功！", "success");
            if(ret.length != 0) {
                var json = JSON.parse(ret);
                local_config = json;
                // var room_ids = [];
                // var usernames = [];
                if(json["audio_url"].length == 0) document.getElementById("audio_id").src = "file/岩崎元是-発芽.mp3";
                else document.getElementById("audio_id").src = json["audio_url"];
                var uid_input = "";
                for(var i = 0; i < json["uids"].length; i++) {
                    if(i == (json["uids"].length - 1)) uid_input = uid_input + json["uids"][i];
                    else uid_input = uid_input + json["uids"][i] + " ";
                }
                document.getElementById("uid_input").value = uid_input;
                if(json["loop_interval"].length == 0) document.getElementById("loop_interval").value = 10;
                else document.getElementById("loop_interval").value = json["loop_interval"]; 
                if(json["img_url"].length == 0) document.body.style.backgroundImage = 'url(img/default_bg.jpg)';
                else document.body.style.backgroundImage = 'url(' + json["img_url"] + ')';
            } else {
            }
        };
        reader.readAsText(file);
    }, onErrorReadFile);
}
 
//FileSystem加载失败回调
function onErrorLoadFs(error) {
    log("文件系统加载失败！" + error, "error");
}
 
//文件夹创建失败回调
function onErrorGetDir(error) {
    log("文件夹创建失败！" + error, "error");
}
 
//文件创建失败回调
function onErrorCreateFile(error) {
    log("文件创建失败！" + error, "error");
}
 
//读取文件失败响应
function onErrorReadFile(error) {
    log("文件读取失败!" + error, "error");
}

// 使用说明
function print_help() {
    var str = "1、首次安装运行程序时会提示权限获取，如果没有给予相应权限则部分功能无法正常使用。（网络用于API请求） \
    2、运行后，可以进行相应的设置（初次使用可以直接点击“配置初始化”，自动完成默认配置）。  \
    功能页：  \
    1）闹钟提醒的音频文件（正常mp3等格式），设置成功后，下方的音频控件会加载音频信息（如果没有加载，可能是文件格式或路径原因，请重新选择文件；另外记得调下音量）；\
    2）UID填写监听B站用户的UID，UID与UID直接用“空格”分隔；  \
    3）轮循间隔是循环调用API的时间差，设置时间越大，开播响应就越慢，流量消耗越少（虽然也要不了几个流量，但不建议太快，有可能会被禁IP）；  \
    设置页：  \
    1）可以修改背景图片；  \
    ps：由于音频和背景图片都是临时生成的加密url，软件重启后则无法正常定位到文件，所以重启后需要重新进行设置。  \
    3、相关配置完成后，回到“功能”页，点击“保存配置”就会写入配置到本地文件中“Documents/APIClock/baseInfo.json”。\
    4、所有配置完成后，点击“自启动运行”即可。程序会程序运行并输出必要的日志。  \
    5、当有设置的用户开播后，程序会“播放音乐”并不在监测此用户，如需继续监听此用户，可以重新点击“自启动运行”。\
    如需关闭程序可以点击“停止运行”或直接关闭程序。  \
    6、日志内容说明：日志有“红、绿、灰、橙”四种颜色，如果出现红色日志，则表示运行出了一些问题，常见的问题为基本是 权限授予问题和网络问题。\
    日志过多时可以点击“清空日志”或者“每分钟清空日志”来进行日志清理。  ";
    log(str);
}


//取得[n,m]范围随机数
function get_random(n, m) {
    var result = Math.random()*(m+1-n)+n;
    while(result>m) {
        result = Math.random()*(m+1-n)+n;
    }
    return result;
}

// 时间戳转 0年月日时分秒毫秒 1年月日时分秒 2时分秒
function time_change(time, type) {
    var date = new Date(time)
    var Y = date.getFullYear() + '-'
    var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
    var D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' '
    var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours())
    var m = ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    var s = ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())
    
    if(type == 0) {
        commonTime = date.toLocaleString();
        return commonTime;
    } else if(type == 1) {
        return Y + M + D + h + m + s;
    } else {
        return h + m + s;
    }
}

// 打印日志
function log(msg, level) {
    level = level || "log";

    if (typeof msg === "object") {
        msg = JSON.stringify(msg, null, "  ");
    }

    // console.log(msg);

    var date = new Date();

    if (level === "status" || level === "error" || level === "success" || level == "warn") {
        var msgDiv = document.createElement("div");
        msgDiv.textContent = "[" + time_change(date, 2) + "]" + msg;

        if (level === "error") {
            msgDiv.style.color = "red";
        } else if(level === "success") {
            msgDiv.style.color = "green";
        } else if(level === "warn") {
            msgDiv.style.color = "#FF9800";
        }

        msgDiv.style.padding = "5px";
        msgDiv.style.borderBottom = "rgb(192,192,192) solid 1px";
        document.getElementById("output").prepend(msgDiv);
    }
    else {
        var msgDiv = document.createElement("div");
        msgDiv.textContent = "[" + time_change(date, 2) + "]" + msg;
        msgDiv.style.color = "#57606a";
        msgDiv.style.padding = "5px";
        msgDiv.style.borderBottom = "rgb(192,192,192) solid 1px";
        document.getElementById("output").prepend(msgDiv);
    }
}

// 清空日志
function clear_log() {
    document.getElementById("output").innerHTML = "";
    clearInterval(clear_log_interval);
    log("已停止每分钟清空日志", "success");
}

// 每分钟清空日志
function auto_clear_log() {
    clear_log_interval = setInterval(function(){document.getElementById("output").innerHTML = "";}, 60000);
}

// 选择音频文件
function set_audio(node) {
    // var file = document.getElementById('file').files[0];
    var url = URL.createObjectURL(node.files[0]);
    log("audio_url:" + url);
    local_config["audio_url"] = url;
    document.getElementById("audio_id").src = url;
}

// 选择背景图片
function set_bg(node) {
    var url = URL.createObjectURL(node.files[0]);
    log("img_url:" + url);
    local_config["img_url"] = url;
    document.body.style.backgroundImage = 'url(' + url + ')';
}

function setFileURL(node) {
    try{
        var file = null;
        if(node.files && node.files[0]){
            file = node.files[0];
        }else if(node.files && node.files.item(0)) {
            file = node.files.item(0);
        }
        //Firefox 因安全性问题已无法直接通过input[file].value 获取完整的文件路径
        try{
            //Firefox7.0
            fileURL =  file.getAsDataURL();
            //alert("//Firefox7.0"+imgRUL);
            console.log(fileURL);
        }catch(e){
            //Firefox8.0以上
            fileURL = window.URL.createObjectURL(file);
            //alert("//Firefox8.0以上"+imgRUL);
            console.log(fileURL);
        }
    }catch(e){      
        //支持html5的浏览器,比如高版本的firefox、chrome、ie10
        if (node.files && node.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                fileURL = e.target.result;
                console.log(fileURL);
            };
            reader.readAsDataURL(node.files[0]);
        }
    }
}
