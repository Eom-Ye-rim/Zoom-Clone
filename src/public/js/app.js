const socket=io();
const welcome=document.getElementById("welcome");
const form=welcome.querySelector("form");
const room=document.getElementById("room");

room.hidden=true;
let roomName;

function showRoom(){
    welcome.hidden=true;
    room.hidden=false;
    const h3=room.querySelector("h3");
    h3.innerText=`Room ${roomName}`;
    const msgForm=room.querySelector("#msg");
    const nameForm=room.querySelector("#name");
    msgForm.addEventListener("submit",handleMessageSubmit);
    nameForm.addEventListener("submit",handleNicknameSubmit);
}
function handleRoomSubmit(event){
    event.preventDefault();
    const input=form.querySelector("input");
    
    //이벤트 발생(emit)시키는 역할
    //socket.emit("enter_room",{payload:input.value});
    // socket.emit("enter_room",input.value,()=>{
    //     console.log("server is done!");
    // });

    socket.emit("enter_room", input.value,showRoom);
    roomName=input.value;
    input.value="";
}

function addMessage(message){
    const ul=room.querySelector("ul");
    const li=document.createElement("li");
    li.innerText=message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input=room.querySelector("#msg input");
    const value=input.value;
    socket.emit("new_message",value,roomName,()=>{
        addMessage(`You:${value}`);
    });
}


function handleNicknameSubmit(event){
    event.preventDefault();
    const input=room.querySelector("#name input");
    const value=input.value;
    socket.emit("nickname",value);

}

form.addEventListener("submit",handleRoomSubmit);

socket.on("welcome",(userNickname,newCount)=>{
    const h3=room.querySelector("h3");
    h3.innerText=`Room ${roomName} (${newCount})`;
    addMessage(`${userNickname} arrived!`);
});
socket.on("bye",(userNickname,newCount)=>{
    const h3=room.querySelector("h3");
    h3.innerText=`Room ${roomName} (${newCount})`;
    addMessage(`${userNickname} left ㅠㅠ`);
});
socket.on("new_message",(msg)=>{
    addMessage(msg);
});

socket.on("room_change",(rooms)=>{
    const roomList=welcome.querySelector("ul");
    roomList.innerHTML="";
    if(rooms.length===0){
        return;
    }
    rooms.forEach((room)=>{
        const li=document.createElement("li");
        li.innerText=room;
        roomList.append(li);
    });
});