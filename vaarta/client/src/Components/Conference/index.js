import React, {useState, useEffect, useRef} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Container,
    Holder,
    Utils,
    VideoContainer,
    ContainerVideo,
    VideoHolder,
    ActionHolder,
    Actions,
    OwnVideo
} from './ConferenceComponent';
import { MdTv, MdCallEnd, MdExpandMore, MdSend } from 'react-icons/md';
import { BiCamera, BiCameraOff, BiMicrophoneOff, BiMicrophone, BiErrorCircle } from 'react-icons/bi';
import { useToast } from '@chakra-ui/react';
import { actions } from './actions';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';

const io = require('socket.io-client');

const useStyles = makeStyles((theme) => ({
    iconHolder: {
        display: 'grid',
        placeItems: 'center',
        width: '100%',
        height: '100%'
    },
    iconStyle:{
        color: 'white',
        width: '100%',
        height: '4vh',
        cursor: 'pointer'
    },
    heading: {
        fontFamily: 'Nunito',
        fontWeight: '600',
        fontSize: '25px',
        color: 'white'
    },
    content:{
        fontFamily: 'Nunito',
        fontSize: '20px'
    },
    linkId:{
        fontFamily: 'Nunito',
        fontWeight: '600',
        fontSize: '20px'
    },
    videoHolder: {
        display: 'grid',
        placeItems: 'center'
    },
    videoClass: {
        borderRadius: '15px',
        overflow: 'hidden',
        transform: 'scaleX(-1)',
        width: '100%',
        height: '100%',
    },
    utils:{
        padding: '7px',
        height: '100vh',
        display: 'grid',
        placeItems:'center'
    },
    accordionStyles: {
        backgroundColor: '#2C3E50',
        color: 'white',
        width: '100%'
    },
    sectionTitle: {
        fontFamily: 'Nunito',
        fontSize: '18px',
        fontWeight: 600
    },
    messageForm: {
        display: 'inline-flex',
        position: 'absolute',
        bottom: 15
    },
    inputMessage: {
        color: 'white',
        fontFamily: 'Nunito',
        fontSize: '15px',
        display: 'inline-flex'
    },
    btnFormMessage: {
        display: 'inline-flex'
    }
}));

function Conference({match, history}){

    const classes = useStyles();
    const userName = sessionStorage.getItem('userName');
    const toast = useToast();
    const toast_id = "toast-id";

    const [expanded, setExpanded] = useState('chatpanel');
    const [message, setMessage] = useState("");

    const socketRef = useRef();

    const handleChange = (panel) => (e, newpanel) => {
        setExpanded(newpanel ? panel : 'chatpanel');
    }

    const appendMessage = (sender, message) => {
        const messageContainer = document.getElementById("messageHolder");

        const newMessage = document.createElement('div');
        newMessage.setAttribute('class', 'newMessageHolderYou');
        
        newMessage.innerHTML = `
            <div class="titleMessage">${sender}</div>
            <div class="message">${message}</div>
        `
        messageContainer.appendChild(newMessage);
    }
    
    const handleMessage = (e) => {
        e.preventDefault();

        if(message !== ""){
            socketRef.current.emit('messageResponse', userName ,message, appendMessage);
            setMessage("");
        }
    }

    const handleConnectLink = () => {
        if(!toast.isActive(toast_id)){
            toast({
                id: toast_id,
                title: "Share Meeting Link",
                description: `http://localhost:3000/join/${match.params.meetId}`,
                duration: 3000,
                position: "top-right"
            })
        }
    }

    const createPeerVideo = (stream, name, id) => {

        var newVideoHolder = document.createElement("div");
        newVideoHolder.setAttribute("id", `peer_${id}`);
        newVideoHolder.setAttribute("class", "videoHolder");

        var newVideo = document.createElement("video");
        newVideo.srcObject = stream;
        newVideo.setAttribute("id", `video_${id}`);
        newVideo.setAttribute("class", "videoClass");
        newVideo.setAttribute("playsInline", true);
        newVideo.setAttribute("autoPlay", true);

        var nameHolder = document.createElement("div");
        nameHolder.setAttribute('class', 'nameHolder');
        nameHolder.innerText = name;

        newVideoHolder.appendChild(newVideo);
        newVideoHolder.appendChild(nameHolder);
        document.getElementById("videoContainer").appendChild(newVideoHolder);
    }

    const createParticipant = (name, peerID) => {
        const participantHolder = document.getElementById("partList");

        const newPart = document.createElement("div");
        newPart.setAttribute("id", `${peerID}`);
        newPart.setAttribute('class', 'participant');

        newPart.innerText = name;
        participantHolder.appendChild(newPart);
    }

    const errorToast = (type) => {
        switch (type) {
            case "streamError":
                if(!toast.isActive(toast_id)){
                    toast({
                        title: "Stream Fetch Error",
                        description: "An error ocurred while trying to fetch your stream",
                        duration: 3000,
                        position: "top-right"
                    })
                }
                break;
            case "shareError":
                if(!toast.isActive(toast_id)){
                    toast({
                        title: "Screen Share Error",
                        description: "An error ocurred while trying to share your screen!",
                        duration: 3000,
                        position: "top-right"
                    })
                }
                break;
            default:
                break;
        }
    }

    useEffect(() => {
        socketRef.current = io("http://localhost:3001/");
        sessionStorage.setItem('reloading', true);

        socketRef.current.on("intializeStream", () => {
            actions(userName, match.params.meetId, socketRef.current, errorToast, createPeerVideo, createParticipant);
        })

        socketRef.current.on("newMessage", (name, message) => {
            const messCont = document.getElementById("messageHolder");
    
            const newMess = document.createElement('div');
            newMess.setAttribute('class', 'newMessageHolder');
    
            newMess.innerHTML = `
                <div class="titleMessage">${name}</div>
                <div class="message">${message}</div>
            `
    
            messCont.appendChild(newMess);
        })

        if(userName){
            const data = {
                name: userName,
                meetId: match.params.meetId
            }
            socketRef.current.emit('joinMeet', data);
        } else {
            history.push(`/join/${match.params.meetId}`);
        }
    }, [match.params.meetId, userName, history]);

    return (
        <Container>
            <Holder>
                <video style={{display: "none"}} autoPlay playsInline id="sharedVideo"></video>
                <ContainerVideo id="displayAll">
                    <VideoContainer id="videoContainer">
                        <VideoHolder>
                            <OwnVideo id="ownVideo" />
                        </VideoHolder>
                    </VideoContainer>
                </ContainerVideo>
                <ActionHolder>
                    <Actions>
                        <div className={classes.iconHolder}>
                            <BiErrorCircle className={classes.iconStyle} onClick = {handleConnectLink} />
                        </div>
                        <div className={classes.iconHolder} id="stopVideo">
                            <BiCamera 
                                className={classes.iconStyle} 
                                id="videoOn"
                            />
                            <BiCameraOff 
                                className={classes.iconStyle} 
                                id="videoOff"
                                style={{display: "none"}}
                            />
                        </div>
                        <div className={classes.iconHolder} id="stopAudio">
                            <BiMicrophone 
                                className={classes.iconStyle} 
                                id="audioOn"
                            />
                            <BiMicrophoneOff 
                                className={classes.iconStyle} 
                                style={{display: "none"}} 
                                id="audioOff"
                            />
                        </div>
                        <div className={classes.iconHolder}>
                            <MdTv className={classes.iconStyle} id="shareBtn" />
                        </div>
                        <div className={classes.iconHolder}>
                            <MdCallEnd className={classes.iconStyle} style={{color:'#FF474C'}} id="disconnectCall" />
                        </div>
                    </Actions>
                </ActionHolder>
            </Holder>
            <Utils className={classes.utils}>
                <Accordion className={classes.accordionStyles} >
                    <AccordionSummary>
                        <Typography className={classes.sectionTitle}>
                            Codebugged AI
                        </Typography>
                    </AccordionSummary>
                </Accordion>
                <Accordion expanded={expanded === 'participants'} onChange={handleChange('participants')} className={classes.accordionStyles}>
                    <AccordionSummary
                        expandIcon={<MdExpandMore style={{color: 'white'}} />}
                    >
                        <Typography className={classes.sectionTitle}>Participants</Typography>
                    </AccordionSummary>
                    <AccordionDetails style={{height: '66vh'}}>
                        <div id="partList"></div>
                    </AccordionDetails>
                </Accordion>
                <Accordion expanded={expanded === 'chatpanel'} className={classes.accordionStyles} onChange={handleChange('chatpanel')}>
                    <AccordionSummary
                        expandIcon={<MdExpandMore style={{color: 'white'}} />}
                    >
                        <Typography className={classes.sectionTitle}>Chat</Typography>
                    </AccordionSummary>
                    <AccordionDetails style={{height: '66vh', position:'relative'}}>
                        <div id="messageHolder" className="messages">
                        </div>
                        <form onSubmit={handleMessage} className={classes.messageForm}>
                            <Input
                                className={classes.inputMessage}
                                value={message}
                                onChange={e=>setMessage(e.target.value)}
                                placeholder="Type your message"
                                variant="outlined"
                            />
                            <Button className={classes.btnFormMessage} type="submit">
                                <MdSend style={{color: 'white'}}/>
                            </Button>
                        </form>
                    </AccordionDetails>
                </Accordion>
            </Utils>
        </Container>
    )
}

export default Conference;