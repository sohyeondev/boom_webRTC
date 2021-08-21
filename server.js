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

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userName) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId, userName)

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId, userName)
        })

        socket.on('message', (message) => {
            socket.to(roomId).broadcast.emit('message', message);
        })
    })

})

server.listen(3000)