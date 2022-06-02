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

var live_status_interval;
var clear_log_interval;
var fileURL = "";
var uids = [];
var room_ids = [];
var usernames = [];

// 睡眠 毫秒
function sleep(delay) {
    let start = +new Date()
    while (+new Date() - start < delay) {}
}

// 更新uid配置
function update_uid_config() {
    var uid_input = document.getElementById("uid_input").value;
    uids = uid_input.split(" ");
    log(uids);
    for(var i = 0; i < uids.length; i++) {
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
    var url = "https://api.bilibili.com/x/space/acc/info?mid=" + uids[index] + "&jsonp=jsonp";
    // 建立所需的对象
    var httpRequest = new XMLHttpRequest();
    // 打开连接  将请求参数写在url中 
    httpRequest.open('GET', url, true);
    // 发送请求  将请求参数写在URL中
    httpRequest.send();
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
                log(uids[index] + "无数据", "error"); 
                usernames.push(username);
                return;
            }

            if(json["code"] != 0) {
                log(uids[index] + "获取用户昵称失败，请检查uid是否正确", "error");
                usernames.push(username);
                return;
            }

            username = json["data"]["name"];
            log("用户名:" + username + " UID:" + uids[index]);
            usernames.push(username);
        }
    };
}

// 通过uid获取room_id
function get_room_id(index) {
    var room_id = "";
    // 构建url
    var url = "https://api.live.bilibili.com/room/v2/Room/room_id_by_uid?uid=" + uids[index]; 
    // 建立所需的对象
    var httpRequest = new XMLHttpRequest();
    // 打开连接  将请求参数写在url中 
    httpRequest.open('GET', url, true);
    // 发送请求  将请求参数写在URL中
    httpRequest.send();
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
                log(uids[index] + "无数据", "error"); 
                room_ids.push(room_id);
                return;
            }

            if(json["code"] != 0) {
                log(uids[index] + "获取房间号失败，请检查uid是否正确", "error");
                room_ids.push(room_id);
                return;
            }

            room_id = json["data"]["room_id"];
            log("房间号:" + room_id + " UID:" + uids[index]);
            room_ids.push(room_id);
        }
    };
}

// 开启循环监听live_status
function loop_listen_live_status() {
    for(var i = 0; i < room_ids.length; i++) {
        get_live_status(i);
        sleep(100);
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

            // 1为直播中 0为未开播 2为轮播中
            if(live_status == 1) {
                var audio = document.getElementById('audio_id');
                audio.play();
                log(usernames[index] + " 正在直播中！！！");
                clearInterval(live_status_interval);
                log("闹钟停止运行", "success");
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
    log("自启动运行还未实现", "error");
}

// 普通运行
function normal_run() {
    update_uid_config();
    clearInterval(live_status_interval);
    // get_live_status();
    var loop_interval = parseInt(document.getElementById("loop_interval").value);
    live_status_interval = setInterval(function(){loop_listen_live_status()}, (loop_interval * 1000 + get_random(0, 100)));
    log("普通运行中...", "success");
}

// 停止运行
function stop_run() {
    clearInterval(live_status_interval);
    var audio = document.getElementById('audio_id');
    audio.stop();
    log("已停止运行", "success");
}

document.addEventListener('deviceready', function () {
    document.getElementById("uid_input").value = "3709626 1944648347";
    document.getElementById("loop_interval").value = "5";

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

//取得[n,m]范围随机数
function get_random(n, m) {
    var result = Math.random()*(m+1-n)+n;
    while(result>m) {
        result = Math.random()*(m+1-n)+n;
    }
    return result;
}

// 打印日志
function log(msg, level) {
    level = level || "log";

    if (typeof msg === "object") {
        msg = JSON.stringify(msg, null, "  ");
    }

    // console.log(msg);

    if (level === "status" || level === "error" || level === "success") {
        var msgDiv = document.createElement("div");
        msgDiv.textContent = msg;

        if (level === "error") {
            msgDiv.style.color = "red";
        }
        else if(level === "success") {
            msgDiv.style.color = "green";
        }

        msgDiv.style.padding = "5px 0";
        msgDiv.style.borderBottom = "rgb(192,192,192) solid 1px";
        document.getElementById("output").appendChild(msgDiv);
    }
    else {
        var msgDiv = document.createElement("div");
        msgDiv.textContent = msg;
        msgDiv.style.color = "#57606a";
        msgDiv.style.padding = "5px 0";
        msgDiv.style.borderBottom = "rgb(192,192,192) solid 1px";
        document.getElementById("output").appendChild(msgDiv);
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
    document.getElementById("audio_id").src = url;
}

// 选择背景图片
function set_bg(node) {
    var url = URL.createObjectURL(node.files[0]);
    log("img_url:" + url);
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
