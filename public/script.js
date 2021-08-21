const socket = io('/');

// peer 생성 및 이름 설정(id는 랜덤)
const myPeer = new Peer()
const userName = prompt("Enter your name")
const userlist = document.getElementById("userlist")

// ROOM_ID와 userId, userName을 서버에 보냄(emit)
myPeer.on('open', (userId) => {
    console.log("myPeer.on [userID] "+userId+" [userName] "+userName)
    socket.emit('join-room', ROOM_ID, userId, userName)
    // user 창에 이름 추가
    const myName = document.getElementById('myName')
    myName.textContent = userName
    myName.style.color = "green"
})

// 내 미디어 장치 불러오기
let myVideoStream;
const myVideo = document.getElementById('myVideo');
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myVideoStream = stream; // 불러온 미디어 장치 stream을 myVideoStream에 저장
    myVideo.srcObject = stream; // stream을 myVideo의 내용물로 보내줌
    // 다른 유저가 call을 보냄
    myPeer.on('call', (call) => {
        call.answer(stream); // call 보낸 유저한테 answer로 내 stream을 보내줌

        // call 보낸 유저의 화면에 내 stream이 보여짐
        // video 태그 만들고, addVideoStream 함수 실행해서 내 stream을 call 보낸 유저한테 보내줌
        const video = document.createElement('video')
        call.on('stream', remoteVideoStream => {
            addVideoStream(video, remoteVideoStream);
        });
    });

    // server.js에서 emit으로 보낸 정보를 받아옴
    // 새로 연결된 유저의 stream을 받아와서 내 화면에 video 태그를 추가함
    socket.on('user-connected', (userId, userName) => {
        console.log("[userID] "+userId+" [userName] "+userName)
        connectToNewUser(userId, stream);

        // 활동중인 유저창에 유저 추가
        const user = document.createElement('li')
        user.className = "actUsers"
        user.textContent = userName
        userlist.appendChild(user)

        // 채팅창에 유저 참가 알림
        const joinMsg = document.createElement('div')
        joinMsg.textContent = "join : "+userName
        chatBox.appendChild(joinMsg)
    });
});

// videostream을 video에 추가하고 화면에 띄움
const videoGrid = document.getElementById('video-grid');
function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
    videoGrid.append(video);
}

// 새로운 유저가 오면 stream을 추가하고 연결이 끊기면 삭제함
const peers = {};
function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream);
    const video = document.createElement('video');
    
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
    })
    call.on('close', () => {
        video.remove();
    })
    peers[userId] = call;
}

// 연결끊김
socket.on('user-disconnected', (userId, userName) => {
    // 활동중인 유저창에서 연결이 끊긴 유저 삭제
    const user = document.getElementsByClassName("actUsers")
    for (i in document.getElementsByClassName("actUsers")) {
        if (user[i].textContent == userName) {
            user[i].remove();
        }
    }
    // 채팅창에 유저가 떠난 걸 알림
    const leaveMsg = document.createElement('div')
    leaveMsg.textContent = "leave : "+userName
    chatBox.appendChild(leaveMsg)

    // peers[userId]에 close() 이벤트 발생 >> call.on('close') 발생(?)
    if (peers[userId]) {
        peers[userId].close();
        delete peers[userId]
    }
});

// 내 비디오 중지
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

// 내 오디오 중지
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

// 활동중인 유저 창 보이게
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

// 채팅창 보이게
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

// 화면공유 기능
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

// 현재 날짜 찍히게(나중에 녹화본 DB에 보낼 때 제목?)
var date = new Date();
var year = date.getFullYear().toString();
var month = ("0"+(date.getMonth() + 1)).slice(-2);
var day = ("0"+date.getDate()).slice(-2);
var hour = ("0"+date.getHours()).slice(-2);
var minute = ("0"+date.getMinutes()).slice(-2);
var second = ("0"+date.getSeconds()).slice(-2);
var today = year+month+day+"."+hour+minute+second

// 녹화 및 다운로드
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
            let url = URL.createObjectURL(blob);
            console.log(download.href)
            download.href = url;
            console.log(url)
            download.download = today+".webm";

        };
        recordBtn.textContent = "download"
        rec.start();
    } else {

        rec.stop(); // 화면 녹화 종료 및 녹화된 영상 다운로드
        
        desktopStream.getTracks().forEach(s => s.stop())
        voiceStream.getTracks().forEach(s => s.stop())
        desktopStream = null;
        desktopStream = null;

        recordBtn.textContent = "record"
    }

});

// 떠나는 버튼인데 실행 안됨
const leaveBtn = document.getElementById("leave");
leaveBtn.addEventListener("click", (e) => {
    if (confirm("Close BOOMTING?")) {
        window.open(window.location.href, '_self', '');
        window.close();
    }
})

// 채팅기능
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