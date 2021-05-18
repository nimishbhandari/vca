import Peer from 'simple-peer';
const wrtc = require('wrtc');

var globalStream;
var socketOwn;
var meetID;
var yourName;

var screenShareIndicator = false;
var otherScreenShare = false;
var otherShareBefore = false;
var sharedStream;

var videoHandler;
var addParticipant;

var myPeers = [];

window.onload = function(){
    if(sessionStorage.getItem('reloading')){
        sessionStorage.removeItem('reloading');
        window.location.href = "http://localhost:3000";
    }
}

const createOwnVideo = (container) => {
    container.srcObject = globalStream;
    container.muted = true;

    container.addEventListener("loadedmetadata", () => {
        container.play();
    })
}

const toggleVideoTracks = () => {

    const stopVideo = document.getElementById("stopVideo");

    if(stopVideo){
        stopVideo.addEventListener("click", () => {
            if(globalStream.getVideoTracks()[0].enabled){
                globalStream.getVideoTracks()[0].enabled = false;
        
                document.getElementById("videoOn").style.display = "none";
                document.getElementById("videoOff").style.display = "flex";
            } else {
                globalStream.getVideoTracks()[0].enabled = true;
        
                document.getElementById("videoOff").style.display = "none";
                document.getElementById("videoOn").style.display = "flex";
            }
        })
    }
}

const toggleAudioTracks = () => {

    const stopAudio = document.getElementById("stopAudio");
    if(stopAudio){
        stopAudio.addEventListener("click", () => {
            if(globalStream.getAudioTracks()[0].enabled){
                globalStream.getAudioTracks()[0].enabled = false;
    
                document.getElementById("audioOn").style.display = "none";
                document.getElementById("audioOff").style.display = "flex";
            } else {
                globalStream.getAudioTracks()[0].enabled = true;
    
                document.getElementById("audioOff").style.display = "none";
                document.getElementById("audioOn").style.display = "flex";
            }
        })
    }
}

const handleShareScreen = (errorToast) => { 
    const shareBtn = document.getElementById("shareBtn");

    if(shareBtn){
        shareBtn.addEventListener("click", () => {
            if(!screenShareIndicator && !otherScreenShare){
                navigator.mediaDevices.getDisplayMedia({cursor: true})
                .then((sharedScreen) => {
        
                    screenShareIndicator = true;
                    sharedStream = sharedScreen;
                    shareBtn.disabled = true;                    

                    screenShareStyles("", "ownStart");
                    socketOwn.emit("iShareScreen", meetID, socketOwn.id);

                    if(myPeers.length !== 0){
                        myPeers.forEach((peerElem) => {
                            peerElem[0].replaceTrack(globalStream.getVideoTracks()[0], sharedStream.getVideoTracks()[0], globalStream);
                        })
                    }
        
                    sharedScreen.getTracks()[0].onended = () => {
                        screenShareIndicator = false;
                        shareBtn.disabled = false;
                        screenShareStyles("", "end");
                        
                        socketOwn.emit("iEndShare", meetID, socketOwn.id);
                        if(myPeers.length !== 0){
                            myPeers.forEach((peerElem) => {
                                peerElem[0].replaceTrack(sharedStream.getVideoTracks()[0], globalStream.getVideoTracks()[0], globalStream);
                            })
                        }
                    }
                })
                .catch((err) => {
                    errorToast("shareError");
                })
            }
        })
    }
}

const alreadySharingHandle = () => {
    socketOwn.on("alreadySharing", (id) => {

        myPeers.forEach((element) => {
            if(element[2] === id){
                if(document.getElementById(`video_${element[1]}`)){
                    screenShareStyles(element[1], "start");
                }
            }
        })
    })
}

const containerStyleCheck = () => {
    const contain = document.getElementById("videoContainer");

    if(myPeers.length > 0){
        contain.style.gridTemplateColumns = 'repeat(auto-fit, minmax(20%, 0.75fr))';
    } else {
        contain.style.gridTemplateColumns = 'unset';
    }
}
 
const screenShareStyles = (id, type) => {
    const videoShareHolder = document.getElementById("sharedVideo");
    const otherVideo = document.getElementById("displayAll");

    if(type === "start"){
        otherVideo.style.display = 'none';
        videoShareHolder.style.display = 'grid';

        videoShareHolder.muted = false;
        videoShareHolder.style.placeSelf = 'center';
        videoShareHolder.style.width = '85%';
        videoShareHolder.style.padding = '5px';
        videoShareHolder.style.borderRadius = '15px';

        videoShareHolder.srcObject = document.getElementById(`video_${id}`).srcObject;
    } else if(type === "end"){
        otherVideo.style.display = 'grid';
        videoShareHolder.style.display = 'none';

        videoShareHolder.srcObject = null;
    } else if(type === "ownStart") {
        otherVideo.style.display = 'none';
        videoShareHolder.style.display = 'grid';

        videoShareHolder.style.placeSelf = 'center';
        videoShareHolder.style.width = '85%';
        videoShareHolder.style.padding = '5px';
        videoShareHolder.style.borderRadius = '15px';

        videoShareHolder.srcObject = sharedStream;
        videoShareHolder.muted = true;
    } else {}
}


const createPeer = (userToSignal, userToCallName, callerID, stream) => {
    const peer = new Peer({
        initiator: true,
        trickle: false,
        wrtc: wrtc,
        stream: stream,
        config:{
            iceServers:[
                { urls: 'stun:stun.l.google.com:19302' }, 
                { urls: 'stun:global.stun.twilio.com:3478?transport=udp' }
            ]
        }
    })

    myPeers.push([peer, peer._id, userToSignal, userToCallName]);

    if(screenShareIndicator){
        peer.replaceTrack(globalStream.getVideoTracks()[0], sharedStream.getVideoTracks()[0], globalStream);
    }
    if(userToSignal === otherShareBefore){
        screenShareStyles(peer._id, "start");
    }

    peer.on("signal", data => {
        socketOwn.emit("callUserGetStream", {toCall: userToSignal, sender: callerID, dataSentAlong: data, name: yourName});
    })

    peer.on("stream", stream => {
        videoHandler(stream, userToCallName, peer._id);
        addParticipant(userToCallName, peer._id);
        screenShareStyles(peer._id, "start");
        containerStyleCheck();
    })

    peer.on('error', (err) => {
        myPeers.forEach((peers) => {
            if(peers[1] === peer._id){
                const vC = document.getElementById("videoContainer");
                if(document.getElementById(peers[1])){
                    vC.removeChild(document.getElementById(`peer_${peers[1]}`));
                }
            }
        })
        document.getElementById("partList").removeChild(document.getElementById(peer._id));
        peer.destroy(err);

        var l = myPeers.filter(p => p[1] !== peer._id);
        myPeers = l;
        containerStyleCheck();
    })

    socketOwn.on("accepted", (data) => {
        peer.signal(data.forYou);
    })
}

const acceptOthersCall = () => {
    socketOwn.on("handshake", (payload) => {

        const peer = new Peer({
            initiator: false,
            trickle: false,
            wrtc: wrtc,
            stream: globalStream
        })

        myPeers.push([peer, peer._id, payload.sender, payload.name]);

        if(screenShareIndicator){
            peer.replaceTrack(globalStream.getVideoTracks()[0], sharedStream.getVideoTracks()[0], globalStream);
        }

        peer.on("signal", data => {
            socketOwn.emit("handshakeAccepted", {acceptor: data, for: payload.sender, name: yourName});
        })

        peer.on("stream", (stream) => {
            containerStyleCheck();
            videoHandler(stream, payload.name, peer._id);
            addParticipant(payload.name, peer._id);
        })



        peer.on('error', (err) => {
            myPeers.forEach((peers) => {
                if(peers[1] === peer._id){
                    const vCo = document.getElementById("videoContainer");
                    if(document.getElementById(peers[1])){
                        vCo.removeChild(document.getElementById(`peer_${peers[1]}`));
                    }
                }
            })
            document.getElementById("partList").removeChild(document.getElementById(peer._id));
            peer.destroy(err);

            var le = myPeers.filter(p => p[1] !== peer._id);
            myPeers = le;
            containerStyleCheck();
        })

        peer.signal(payload.mySignal);
    })
}

const disconnectFromCall = () => {

    const disconnect = document.getElementById("disconnectCall");

    if(disconnect){
        disconnect.addEventListener("click", () => {
            socketOwn.emit('disconnectCall', meetID, socketOwn.id, disconnected);
        })
    }
}

const disconnected = () => {
    window.location.href = "http://localhost:3000";
}

const thisUserDisconnected = () => {

    socketOwn.on("thisUserDisconnected", (userID) => {
        myPeers.forEach((peer) => {
            if(peer[2] === userID){
                const vC1 = document.getElementById("videoContainer");
                if(document.getElementById(peer[1])){
                    vC1.removeChild(document.getElementById(`peer_${peer[1]}`));
                }
            }
            document.getElementById("partList").removeChild(document.getElementById(peer[0]._id));
            peer[0].destroy();
        })

        var lee = myPeers.filter(p => p[2] !== userID);
        myPeers = lee;
        containerStyleCheck();
    })
}

const screenShareManipulation = () => {
    socketOwn.on("screenShared", (videoID) => {

        otherScreenShare = true;
        myPeers.forEach((element) => {
            if(element[2] === videoID){
                if(document.getElementById(`video_${element[1]}`)){
                    screenShareStyles(element[1], "start");
                }
            }
        })
    })

    socketOwn.on("endScreenShare", (videoID) => {

        otherScreenShare = false;
        otherShareBefore = false;
        myPeers.forEach((element) => {
            if(element[2] === videoID){
                if(document.getElementById(`video_${element[1]}`)){
                    screenShareStyles(element[1], "end");
                }
            }
        })
    })

    socketOwn.on("screenSharer", (videoID) => {
        otherShareBefore = videoID;
    })
}

export const actions = (name, meetId, socket, errorToast, createPeerVideo, createParticipant) => {
    navigator.mediaDevices.getUserMedia({
        video: {
            width: 300,
            height: 250
        },
        audio: true
    })
    .then((stream) => {

        yourName = name;
        globalStream = stream;
        socketOwn = socket;
        meetID = meetId;

        videoHandler = createPeerVideo;
        addParticipant = createParticipant;

        const ownVideo = document.getElementById("ownVideo");
        createOwnVideo(ownVideo);

        screenShareManipulation();
        handleShareScreen(errorToast);
        alreadySharingHandle();

        toggleVideoTracks();
        toggleAudioTracks();

        acceptOthersCall();
        disconnectFromCall();
        thisUserDisconnected();

        socket.emit("getAllUsers", meetId);
        socket.on("allUsers", users => {
            users.forEach(userID => {
                createPeer(userID[0], userID[1], socket.id, stream, createPeerVideo);
            })
        })
    })
    .catch((err) => {
        errorToast("streamError");
    })
}