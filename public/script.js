const socket = io('/');

const myPeer = new Peer()
const userName = prompt("Enter your name")
const userlist = document.getElementById("userlist")
const myName = document.getElementById('myName')

myPeer.on('open', (userId) => {
    
    console.log("[userID] "+userId+" [userName] "+userName)
    socket.emit('join-room', ROOM_ID, userId, userName) // >> server.js socket.on(roomId, userId)
    myName.innerHTML = userName
    myName.style.color = "green"

})

myPeer.on('connection', (userId) => {
    console.log("go[userID] "+userId+" [userName] "+userName)
})

const myVideo = document.getElementById('myVideo');
const peers = {};

let myVideoStream;
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream;
    myVideo.srcObject = stream;

    myPeer.on('call', (call) => {
        for (key in call) {
            console.log(call[key])
        }
        call.answer(stream);
        const video = document.createElement('video')
        const user = document.createElement('li')
        // 상대방 화면에서 내 화면이 보이게
        call.on('stream', remoteVideoStream => {
            addVideoStream(video, user, userName, remoteVideoStream);
        });
    });

    // 내 화면에서 상대방이 보이게
    socket.on('user-connected', (userId, userName) => {
        connectToNewUser(userId, userName, stream);
        console.log("[userID] "+userId+" [userName] "+userName)
    });

});

socket.on('user-disconnected', (userId, userName) => {
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId]
    }
});

function connectToNewUser(userId, userName, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    const user = document.createElement('li')

    const connUser = document.createElement('div')
    connUser.innerHTML = "join : "+userName
    chatBox.appendChild(connUser)
    
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, user, userName, userVideoStream);
    })
    call.on('close', () => {
        const disConnUser = document.createElement('div')
        disConnUser.innerHTML = "leave : "+userName
        chatBox.appendChild(disConnUser)
        video.remove();
        user.remove();
    })

    peers[userId] = call;
}

const videoGrid = document.getElementById('video-grid');
function addVideoStream(video, user, userName, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video);
    user.innerHTML = userName
    userlist.append(user)
}

const stopVideoBtn = document.getElementById("stopVideo")
stopVideoBtn.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        stopVideoBtn.style.textDecoration = "line-through"
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        stopVideoBtn.style.textDecoration = "none"
    }
})

const muteAudioBtn = document.getElementById("muteAudio")
muteAudioBtn.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if(enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        muteAudioBtn.style.textDecoration = "line-through"
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        muteAudioBtn.style.textDecoration = "none"
    }
})

const mainLeft = document.getElementById("main_left")
const mainRight = document.getElementById("main_right")
const activeUsers = document.getElementById("activeUsers")
const messageChat = document.getElementById('messageChat')

const showUsersBtn = document.getElementById("showUsers");
showUsersBtn.addEventListener("click", () => {
    if (activeUsers.style.display == "flex") {
        activeUsers.style.display = "none";
        showUsersBtn.style.textDecoration = "none";
        if (messageChat.style.display == "flex") {
            messageChat.style.flex = "1";
        } else {
            mainLeft.style.flex = "1"
            mainRight.style.display = "none"
        }
    } else {
        activeUsers.style.display = "flex";
        showUsersBtn.style.textDecoration = "line-through"
        if (messageChat.style.display == "flex") {
            activeUsers.style.flex = "0.5"
            messageChat.style.flex = "0.5"
        } else {
            mainLeft.style.flex = "0.80"
            mainRight.style.display = "flex"
            mainRight.style.flex = "0.20"
        }
    }
})

const inviteBtn = document.getElementById("invite");
inviteBtn.addEventListener("click", (e) => {
    prompt(
        "Copy this link and send it to people you want to meet with",
    );
});

const showChatBtn = document.getElementById("showChat");
showChatBtn.addEventListener("click", () => {
    if (messageChat.style.display == "flex") {
        messageChat.style.display = "none";
        showChatBtn.style.textDecoration = "none";
        if (activeUsers.style.display == "flex") {
            activeUsers.style.flex = "1";
        } else {
            mainLeft.style.flex = "1"
            mainRight.style.display = "none"
        }
    } else {
        messageChat.style.display = "flex";
        showChatBtn.style.textDecoration = "line-through"
        if (activeUsers.style.display == "flex") {
            activeUsers.style.flex = "0.5"
            messageChat.style.flex = "0.5"
        } else {
            mainLeft.style.flex = "0.80"
            mainRight.style.display = "flex"
            mainRight.style.flex = "0.20"
        }
    }
})

const sharingScreenBtn = document.getElementById("sharingScreen");
sharingScreenBtn.addEventListener("click", () => {
    startScreenShare();
})

let screenSharing = false;
let screenStream;
function startScreenShare() {
    if (screenSharing) {
        stopScreenSharing()
    }
    navigator.mediaDevices.getDisplayMedia({
        video: true
    }).then((stream) => {
        sharingScreenBtn.disabled = true;
        stopVideoBtn.disabled = true;
        myVideo.srcObject = stream;

        screenStream = stream;
        let videoTrack = screenStream.getVideoTracks()[0];
        videoTrack.onended = () => {
            stopScreenSharing();
        }
        if (myPeer) {
            for(key in peers) {
                let sender = peers[key].peerConnection.getSenders().find(function (s) {
                    return s.track.kind == videoTrack.kind;
                })
                sender.replaceTrack(videoTrack)
            }
            screenSharing = true
        }
    })
}

function stopScreenSharing() {
    if(!screenSharing) return;
    let videoTrack = myVideoStream.getVideoTracks()[0];
    if (myPeer) {
        for(key in peers) {
            let sender = peers[key].peerConnection.getSenders().find(function (s) {
                return s.track.kind == videoTrack.kind;
            })
            sender.replaceTrack(videoTrack)
        }
    }
    screenStream.getTracks().forEach(function(track) {
        track.stop();
    });
    screenSharing = false
    sharingScreenBtn.disabled = false;
    stopVideoBtn.disabled = false;
    myVideo.srcObject = myVideoStream;
}

var date = new Date();
var year = date.getFullYear().toString();
var month = ("0"+(date.getMonth() + 1)).slice(-2);
var day = ("0"+date.getDate()).slice(-2);
var hour = ("0"+date.getHours()).slice(-2);
var minute = ("0"+date.getMinutes()).slice(-2);
var second = ("0"+date.getSeconds()).slice(-2);
var today = year+month+day+"."+hour+minute+second

const recordBtn = document.getElementById('recording');
const download = document.getElementById('download');
let blobs;
let blob; // 데이터
let rec; // 스트림을 기반으로 동작하는 mediarecorder
let allStream; // 통합
let voiceStream; // 오디오 스트림
let desktopStream; // 비디오 스트림

const mergeStreams = (desktopStream, voiceStream) => { //비디오, 오디오 스트림 연결
    const context = new AudioContext();
    const destination = context.createMediaStreamDestination();
    let hasDesktop = false;
    let hasVoice = false;
    if (desktopStream && desktopStream.getAudioTracks().length > 0) {
        const source1 = context.createMediaStreamSource(desktopStream);
        const desktopGain = context.createGain();
        desktopGain.gain.value = 0.7;
        source1.connect(desktopGain).connect(destination);
        hasDesktop = true;
    }
    if (voiceStream && voiceStream.getAudioTracks().length > 0) {
        const source2 = context.createMediaStreamSource(voiceStream);
        const voiceGain = context.createGain();
        voiceGain.gain.value = 0.7;
        source2.connect(voiceGain).connect(destination);
        hasVoice = true;
    }
    return (hasDesktop || hasVoice) ? destination.stream.getAudioTracks() : [];

}

recordBtn.addEventListener('click', async () => {
    if(recordBtn.textContent == "record") {
        desktopStream = await navigator.mediaDevices.getDisplayMedia({video: {width: 640, height: 480}, audio: true}) // 비디오스트림 생성
        voiceStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true}); // 오디오 스트림 생성
    
        const tracks = [
            ...desktopStream.getVideoTracks(),
            ...mergeStreams(desktopStream, voiceStream)
        ];
    
        allStream = new MediaStream(tracks);
    
        blobs = [];
    
        rec = new MediaRecorder(allStream, {mimeType: 'video/webm; codecs=vp9,opus'}); // mediaRecorder 객체 생성
        rec.ondataavailable = (e) => blobs.push(e.data);
        rec.onstop = async () => {

            blob = new Blob(blobs, {type: 'video/webm'});
            console.log(blob)
            let url = URL.createObjectURL(blob);
            console.log(URL)
            download.href = url;
            console.log(download.href)
            download.download = today+".webm";

        };
        recordBtn.textContent = "download"
        rec.start();
        console.log(allStream)
    } else {

        rec.stop(); // 화면 녹화 종료 및 녹화된 영상 다운로드
        
        desktopStream.getTracks().forEach(s => s.stop())
        voiceStream.getTracks().forEach(s => s.stop())
        desktopStream = null;
        desktopStream = null;

        recordBtn.textContent = "record"
    }

});

const leaveBtn = document.getElementById("leave");
leaveBtn.addEventListener("click", (e) => {
    if (confirm("Close BOOMTING?")) {
        window.open(window.location.href, '_self', '');
        window.close();
    }
})

const sendBtn = document.getElementById('sendBtn');
const chatBox = document.getElementById('chatBox');
const textMsg = document.getElementById('textMsg');

sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const message = textMsg.value;
    socket.emit('message', message);
    textMsg.value = '';
    chatBox.appendChild(makeMessage(message, false));
})

textMsg.addEventListener('keydown', (e) => {
    if(e.key === "Enter") {
        const message = textMsg.value;
        socket.emit('message', message);
        textMsg.value = '';
        chatBox.appendChild(makeMessage(message, false));
    }
})

socket.on('message', (message) => {
    chatBox.appendChild(makeMessage(message, true));
})

function makeMessage(message, isOthers) {
    const msgBox = document.createElement('div');
    const classname = isOthers ? "others-message-wrapper" : "my-message-wrapper";
    msgBox.className = classname;
    msgBox.innerText = message;
    return msgBox;
}