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

var Interval1;
var fileURL = "";

// 获取直播间开播情况
function get_live_status() {
    var live_status = 0;
    var room_id = document.getElementById("room_id").value;
    // 构建url
    var url = "https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?room_id="  + room_id 
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
            // console.log(json);
            // log(json);
            // alert(json);

            if (json.length == 0) {
                // console.log("无数据"); 
                // log("无数据"); 
                return 0;
            }

            live_status = json["data"]["live_status"];

            // 1为直播中 0为未开播 2为轮播中
            if(live_status == 1) {
                var audio = document.getElementById('audio_id');
                audio.play();
                clearInterval(Interval1);
            }

            return live_status;
        }
    };

    // console.log("get_live_status() over");
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
    console.log("自启动运行还未实现");
    log("自启动运行还未实现", "error");
    // console.log("self_start_run() over");
    // log("self_start_run() over");
}

// 普通运行
function normal_run() {
    clearInterval(Interval1);
    // get_live_status();
    Interval1 = setInterval(function(){get_live_status()}, (10000 + get_random(0, 100)));
    console.log("普通运行中...");
    log("普通运行中...", "success");
}

document.addEventListener('deviceready', function () {
    document.getElementById("room_id").value = "23720185";
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

    console.log(msg);

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

function set_audio(node) {
    // var file = document.getElementById('file').files[0];
    var url = URL.createObjectURL(node.files[0]);
    console.log(url);
    log("audio_url:" + url);
    document.getElementById("audio_id").src = url;
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