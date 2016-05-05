window.youchat = {};

youchat.keymap = {};
youchat.keymap.enter = 13;

youchat.dom = {};

youchat.user = {};
youchat.user.id = "Anonymous";
youchat.user.room = "Global";

youchat.client = {};
youchat.client.ws = null;
youchat.client.url = "ws://127.0.0.1:8025/api/youchat";

youchat.client.init = function () {
    youchat.client.ws = new WebSocket(youchat.client.url);
    youchat.client.ws.onopen = youchat.client.callback.onopen;
    youchat.client.ws.onmessage = youchat.client.callback.onmessage;
    youchat.client.ws.onclose = youchat.client.callback.onclose;
    youchat.client.ws.onerror = youchat.client.callback.onerror;
};

youchat.client.callback = {};
youchat.client.callback.onopen = function () {
    console.log("ws open");
};

youchat.client.callback.onmessage = function (e) {
    var json = JSON.parse(e.data);
    console.log("ws received: " + e.data);
    console.log('json.type[0]:'+json.type[0]);
    //console.log('json.status[0]:'+json.status[0]);

    switch (json.type[0]) {
        case "login":
            if(!youchat.user.id || youchat.user.id == "Anonymous"){
                youchat.user.id = json.user_id[0];
            }
            var num = $('#room-info .panel-heading b').html();
            $('#room-info .panel-heading b').html(parseInt(num) +1);
            $('#room-info .list-group').append('\
                <li class="list-group-item">'
            + json.user_id[0]
            +'  <a>私聊我</a>'+
            '</li>')
                youchat.update_chat_info();
            break;
        case "register":
            youchat.add_chat_content(json.msg);
            break;
        case "notify":
            youchat.add_chat_content(json.msg);
            break;
        case "msg":
            youchat.add_chat_content(json.msg);
            break;

    }

    switch (json.type) {
        case "login":
            if (json.status[0] == "true") {
                youchat.user.id = json.user_id[0];
                youchat.update_chat_info();
            }
            break;
        case "register":
            youchat.add_chat_content(json.msg);
            break;
        case "notify":
            youchat.add_chat_content(json.msg);
            break;
        case "msg":
            youchat.add_chat_content(json.id + ':' + json.msg);
            break;
        case "send":
            youchat.add_chat_content(json.id + ':' + json.msg);
            break;
    }
};

youchat.client.callback.onclose = function (e) {
    console.log("ws closed");
};

youchat.client.callback.onerror = function (e) {
    console.log("ws error");
};

youchat.handler = {};
youchat.handler["/msg"] = function() {
    var json = youchat.get_json(
        "msg",
        youchat.user.id,
        youchat.user.room,

        youchat.dom.input_text.val().split(" ").slice(0) == '/msg'?
            youchat.dom.input_text.val().split(" ").slice(1):youchat.dom.input_text.val().split(" ").slice(0)
    );
    console.log("msg:" + json);
    youchat.client.ws.send(json);
};

youchat.handler["/login"] = function(cmd) {
    var _, user_id, passwd;
    [_, user_id, passwd] = cmd.split(" ");
    if (!user_id || !passwd){
        youchat.add_chat_content("login format wrong, enter /help to get help");
        return;
    }
    passwd = youchat.sha512(passwd);
    var json = JSON.stringify({
        "type": "login",
        "user_id": user_id,
        "passwd": passwd
    });
    console.log("login:" + json);
    youchat.client.ws.send(json);
};

youchat.handler["/reg"] = function(cmd) {
    var _, user_id, passwd, email;
    [_, user_id, passwd, email] = cmd.split(" ");
    if (!user_id || !passwd || !email){
        youchat.add_chat_content("reg format wrong, enter /help to get help");
        return;
    }
    passwd = youchat.sha512(passwd);
    var json = JSON.stringify({
        "type": "reg",
        "user_id": user_id,
        "passwd": passwd,
        "email": email
    });
    console.log("reg:" + json);
    youchat.client.ws.send(json);
};

youchat.handler["/send"] = function() {
    var inputArr = youchat.dom.input_text.val().split(" ");
    console.log(inputArr)
    var json = JSON.stringify({
        type: "send",
        id: youchat.user.id,
        to: inputArr[1],
        msg: inputArr.slice(2)
    });
    console.log("msg:" + json);
    youchat.client.ws.send(json);
};

youchat.sha512 = function(str) {
    var shaObj = new jsSHA(str, "TEXT");
    return shaObj.getHash("SHA-512", "HEX");
};

youchat.get_json = function(type, id, room, msg) {
    return JSON.stringify({
        "type": type,
        "id": id,
        "room": room,
        "msg": msg
    });
};

youchat.keyup = function (e) {
    var key_code = e.which;
    switch (key_code) {
        case youchat.keymap.enter :
            youchat.parse_cmd();
            break;
    }
};

youchat.parse_cmd = function() {
    var cmd = youchat.dom.input_text.val();
    var type = "/msg";
    for (var i in youchat.handler) {
        if (cmd.search(i) == 0) {
            type = i;
        }
    }
    console.log("get " + type);
    youchat.handler[type](cmd);
    youchat.dom.input_text.val("");
};

youchat.update_chat_info = function() {
    youchat.dom.chat_info.html(youchat.user.id + "@" + youchat.user.room);
};

youchat.add_chat_content = function(str) {
    youchat.dom.chat_container.append($("<div>" + str + "</div>"));
    console.log('appended');
};

youchat.init = function() {
    document.body.style.overflow = "hidden";
    //window.onbeforeunload = check_leave;
    function check_leave() {
        return "Don't leave, please. QAQ";
    }
    window.PerfectScrollbar.initialize(document.getElementById('chat-container'));
    youchat.dom.input_text = $("#input-text");
    youchat.dom.input_text.keyup(youchat.keyup);

    youchat.dom.chat_info = $("#input-info");
    youchat.update_chat_info();

    youchat.dom.chat_container = $("#chat-container:first-child");

    youchat.client.init();
};

$(document).ready(function() {
    console.log("init");
    youchat.init();
});