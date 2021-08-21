const express = require("express");
const app = express();
const server = require('http').Server(app)
const io = require('socket.io')(server)
// Universally Unique IDentifier 생성
// v4 : 랜덤값 기반으로 uuid 생성
const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req,res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req,res) => {
    res.render('room', { roomId: req.params.room }) // ejs >> ROOM_ID
})

// 연결이 발생하면
io.on('connection', socket => {
    // script.js 에서 join-room 이벤트로 보내준 정보를 받아옴
    socket.on('join-room', (roomId, userId, userName) => {
        // roomId에 들어감
        socket.join(roomId);
        // roomId에 있는 사람들에게 들어온 유저의 id와 name을 보내줌
        socket.to(roomId).broadcast.emit('user-connected', userId, userName)
        // 누군가 연결을 끊으면 roomId에 있는 사람들에게 나간 유저의 id와 name을 보내줌
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId, userName)
        })
        // script.js에서  message 이벤트로 보내준 정보를 받아옴
        socket.on('message', (message) => {
            socket.to(roomId).broadcast.emit('message', message);
        })
    })

})

server.listen(3000)