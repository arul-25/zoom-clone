const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

var myPeer = new Peer(undefined, {
	path: "/peerjs",
	host: "/",
	port: "8000"
});

let myVideoStream;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

navigator.mediaDevices
	.getUserMedia({
		video: true,
		audio: true
	})
	.then((stream) => {
		myVideoStream = stream;
		addVideoStream(myVideo, stream);

		socket.on("user-connected", (userId) => {
			connectToNewUser(userId, stream);
		});
	});

myPeer.on("call", function (call) {
	getUserMedia(
		{
			video: true,
			audio: true
		},
		function (stream) {
			call.answer(stream);
			const video = document.createElement("video");
			call.on("stream", function (remoteStream) {
				addVideoStream(video, remoteStream);
			});
		},
		function (err) {
			console.log(`Failed to get local stream : ${err}`);
		}
	);
});

myPeer.on("open", (id) => {
	socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
	var call = myPeer.call(userId, stream);
	var video = document.createElement("video");

	call.on("stream", (userVideoStream) => {
		addVideoStream(video, userVideoStream);
	});
}

function addVideoStream(video, stream) {
	video.srcObject = stream;
	video.addEventListener("loadedmetadata", () => {
		video.play();
	});
	videoGrid.append(video);
}

// unmute button
const muteUnmute = () => {
	const enabled = myVideoStream.getAudioTracks()[0].enabled;
	if (enabled) {
		myVideoStream.getAudioTracks()[0].enabled = false;
		setUnmuteButton();
	} else {
		setMuteButton();
		myVideoStream.getAudioTracks()[0].enabled = true;
	}
};

const setMuteButton = () => {
	const html = `
		<i class="fas fa-microphone"></i>
		<span>Mute</span>
	`;
	document.querySelector(".main__mute__button").innerHTML = html;
};

const setUnmuteButton = () => {
	const html = `
		<i class="unmute fas fa-microphone-slash"></i>
		<span>Unmute</span>
	`;
	document.querySelector(".main__mute__button").innerHTML = html;
};

// stop video button
const playStop = () => {
	let enabled = myVideoStream.getVideoTracks()[0].enabled;
	if (enabled) {
		myVideoStream.getVideoTracks()[0].enabled = false;
		setStopVideo();
	} else {
		setPlayVideo();
		myVideoStream.getVideoTracks()[0].enabled = true;
	}
};

const setPlayVideo = () => {
	const html = `
		<i class="fas fa-video"></i>
		<span>Play Video</span>
	`;
	document.querySelector(".main__video__button").innerHTML = html;
};

const setStopVideo = () => {
	const html = `
		<i class="stop_video fas fa-video-slash"></i>
		<span>Stop Video</span>
	`;
	document.querySelector(".main__video__button").innerHTML = html;
};

// create message
let text = $("input");

$("html").keydown((e) => {
	if (e.which == 13 && text.val().length !== 0) {
		socket.emit("message", text.val());
		text.val("");
	}
});

socket.on("createMessage", (message) => {
	$(".messages").append(`<li class="message"><b>user</b><br/>${message}</li>`);
	scrollToBottom();
});

function scrollToBottom() {
	let d = $(".main__chat__window");
	d.scrollTop(d.prop("scrollHeight"));
}
