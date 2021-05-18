require('dotenv').config({
    path: './config/config.env'
})

const http = require('http');
const app = require('./app');

const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors:{
        origin: "http://localhost:3000"
    }
})

const meetingUsers = {};
const shareScreenMeeting = {};

io.on('connection', socket => {

    socket.on('checkMeetExists', (data, handleCheckResponse) => {
        if(meetingUsers[data]){
            handleCheckResponse("exists");
        } else {
            handleCheckResponse("notExists");
        }
    })

    socket.on('joinMeet', (data) => {

        if(meetingUsers[data.meetId]){

            meetingUsers[data.meetId].forEach((element) => {
                if(element[0] === socket.id){
                    return;
                }
            })
            socket.join(data.meetId);
            meetingUsers[data.meetId].push([socket.id, data.name]);
        } else {
            meetingUsers[data.meetId] = [[socket.id, data.name]];
            socket.join(data.meetId);
        }
        socket.emit("intializeStream");
    })

    socket.on("getAllUsers", (meetId) => {
        const usersHere = meetingUsers[meetId].filter(id => id[0] !== socket.id); 
        socket.emit("allUsers", usersHere);
        if(shareScreenMeeting[meetId]){
            socket.emit("screenSharer", shareScreenMeeting[meetId]);
        }
    })

    socket.on("callUserGetStream", (data) => {
        io.to(data.toCall).emit("handshake", {mySignal: data.dataSentAlong, sender: data.sender, name: data.name});
    })

    socket.on("handshakeAccepted", (data) => {
        io.to(data.for).emit("accepted", {forYou: data.acceptor});
    })

    socket.on("messageResponse", (username, message, appendMessage) => {
        appendMessage('You', message);        
        socket.broadcast.emit("newMessage", username, message);
    })

    socket.on("iShareScreen", (meetID, videoID) => {
        if(!shareScreenMeeting[meetID]){
            shareScreenMeeting[meetID] = [videoID];
        }
        io.to(meetID).emit("screenShared", videoID);
    })

    socket.on("iEndShare", (meetID, videoID) => {
        if(shareScreenMeeting[meetID]){
            delete shareScreenMeeting[meetID];
        }      
        io.to(meetID).emit("endScreenShare", videoID);
    })

    socket.on("screenSharedAlready", (peerID, toSignalID) => {
        io.to(toSignalID).emit("alreadySharing", peerID);
    })

    socket.on("disconnectCall", (meetID, socketID, disconnected) => {
        if(meetingUsers[meetID]){
            meetingUsers[meetID] = meetingUsers[meetID].filter(id => id[0] !== socketID);

            disconnected();
            io.to(meetID).emit("thisUserDisconnected", socketID);
        }
    })
})

server.listen(`${process.env.PORT}`, (req, res) => {
    console.log("Server Listening");
})