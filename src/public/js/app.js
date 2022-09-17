const socket=io();
const myFace=document.getElementById("myFace");
const muteBtn=document.getElementById("mute");
const cameraBtn=document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call =document.getElementById("call") //미디어와 관련된 요소

const welcome=document.getElementById("welcome");
const welcomeForm=welcome.querySelector("form");



call.hidden=true;
let roomName;
let myPeerConnection;
let myDataChannel;

async function initCall(){
    welcome.hidden=true;
    call.hidden=false;
    await getMedia();
    makeConnection();
}


async function handelWelcomeSubmit(event){
    event.preventDefault();
    const input=welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room",input.value);
    roomName=input.value;
    console.log(input.value);
    input.value="";
}




//화상 카메라 설정
let myStream;
let muted=false;
let cameraOff=false;


async function getCameras(){
    try{
        const devices=await navigator.mediaDevices.enumerateDevices();
       
        const cameras=devices.filter((device)=>device.kind==="videoinput");
        
        const currentCamera=myStream.getVideoTracks()[0];
        console.log(currentCamera);
       
        cameras.forEach((camera)=>{
            const option=document.createElement("option");
            option.value=camera.deviceId; // 카메라 제어할 때 필요한 기기 id
            option.innerText=camera.label; //카메라 모델명을 표시하는 역할
            cameraSelect.appendChild(option);
            if(currentCamera.label==camera.label){
                option.selected=true;
            }
            
        });
    }
    catch(e){
        console.log(e);
    }
}

async function handleCameraChange(){
    await getMedia(cameraSelect.value);
    if(myPeerConnection){
        const videoTrack=myStream.getVideoTracks()[0];
        const videoSender=myPeerConnection
        .getSenders()
        .find((sender)=>sender.track.kind==="video");
        videoSender.replaceTrack(videoTrack);
    }
  
}
function handleMuteClick(){
    myStream.getAudioTracks()
    .forEach((track)=>(track.enabled=!track.enabled));
    if(!muted){
        muteBtn.innerText="Unmute";
        muted=true;
    }
    else{
        muteBtn.innerText="Mute";
        muted=false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks()
    .forEach((track)=>(track.enabled=!track.enabled));
    if(!cameraOff){
        cameraBtn.innerText="Turn Camera On";
        cameraOff=true;
    }
    else{
        cameraBtn.innerText="Turn Camera Off";
        cameraOff=false;
    }
}

async function getMedia(deviceId){
    const initialConstraints={
        audio:true, //제약
        video:{facingMode:"user"},
    };
    const cameraConstraints={
        audio:true,
        video:{deviceId:{exact:deviceId}}
    };
    try{
        myStream=await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints:initialConstraints
        );
        console.log(myStream);
        myFace.srcObject=myStream;
        if(!deviceId){
        await getCameras();
        }
    }
    catch{
        console.log(e);
    }
    }

muteBtn.addEventListener("click",handleMuteClick);
cameraBtn.addEventListener("click",handleCameraClick);
cameraSelect.addEventListener("input",handleCameraChange);
welcomeForm.addEventListener("submit",handelWelcomeSubmit);

//socket code
socket.on("welcome",async()=>{
    myDataChannel=myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message",(event)=>{
        console.log(event.data);
    });
    console.log("made data channel");
    const offer=await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer); // setLocalDescription : 연결의 속성 지정
    console.log("sent the offer"); // offer를 보내는 쪽에서 실행
    socket.emit("offer",offer,roomName);
   
});

socket.on("offer",async(offer)=>{ //offer를 받는 쪽에서 실행
    myPeerConnection.addEventListener("datachannel",(event)=>{
        
        myDataChannel=event.channel;
        myDataChannel.addEventListener("message",(event)=>{
            console.log(event.data);
        });
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer=await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer); 
    socket.emit("answer",answer,roomName);
    console.log("sent the answer");
});


socket.on("answer",answer=>{ //offer를 받는 쪽에서 실행
    myPeerConnection.setRemoteDescription(answer); 
});


socket.on("ice",ice=>{ //candidate 받는 쪽에서 실행
    console.log("received candidate")
  
    myPeerConnection.addIceCandidate(ice);
   
});


//RTC code
function makeConnection(){
    myPeerConnection=new RTCPeerConnection({
        iceServers:[
            {
                urls:[
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ]
            }]
    }); 
    console.log(myStream.getTracks()); // 각 미디어가 포함된 배열 
    myPeerConnection.addEventListener("icecandidate",handleIce);
    myPeerConnection.addEventListener("addstream",handleAddStream);
    myStream.getTracks()
    .forEach(track=>myPeerConnection.addTrack(track,myStream));
}

function handleIce(data){
    console.log("Sent candidate");
    socket.emit("ice",data.candidate,roomName);
   
}



function handleAddStream(data){
    const peerFace=document.getElementById("peerFace");
    peerFace.srcObject=data.stream;
}