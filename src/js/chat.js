'use strict';
const socket = io();

const nickname = document.querySelector('#nickname');
const chatList = document.querySelector('.chatting-list');
const chatInput = document.querySelector('.chatting-input');
const sendButton = document.querySelector('.send-button');
const displayContainer = document.querySelector('.display-container'); //스크롤 따라가기

chatInput.addEventListener('keypress', event => {
    if (event.keyCode === 13) {
        send();
    }
});

function send() {
    const param = {
        name: nickname.value,
        msg: chatInput.value,
    };
    socket.emit('chatting', param); // 서버와 연결
}

sendButton.addEventListener('click', send);

socket.on('chatting', data => {
    //서버로부터 데이터 받기
    console.log(data);
    const { name, msg, time } = data;
    const item = new LiModel(name, msg, time); //LiModel 인스턴스화(초기화)
    item.makeLi();
    displayContainer.scrollTo(0, displayContainer.scrollHeight); //스크롤 따라가기
});

function LiModel(name, msg, time) {
    this.name = name;
    this.msg = msg;
    this.time = time;

    this.makeLi = () => {
        const li = document.createElement('li');
        li.classList.add(nickname.value === this.name ? 'sent' : 'received');
        const dom = `<span class="profile">
            <span class="user">${this.name}</span>
            <img src="https://placeimg.com/200/50/any" class="image" alt="any">
        </span>
        <span class="message">${this.msg}</span>
        <span class="time">${this.time}</span>`;
        li.innerHTML = dom;
        chatList.appendChild(li);
    };
}

console.log(socket);
