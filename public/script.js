
const socket = io(location.href); // Replace with your local IP
const iceServerConfig = {
    iceServers: [
        { urls: ["stun:bn-turn1.xirsys.com"] },
        {
            username: "K2i0P0uJ2RjU4q2oV0VCXYkuu3197Ltjq_qiiB2Gv_hPuXXTaGYjf5C55zPqgHMBAAAAAGg9J2Zub29yYWlubWRu",
            credential: "6bebe5e6-3f69-11f0-b040-0242ac140004",
            urls: ["turn:bn-turn1.xirsys.com:80?transport=udp", "turn:bn-turn1.xirsys.com:3478?transport=udp", "turn:bn-turn1.xirsys.com:80?transport=tcp", "turn:bn-turn1.xirsys.com:3478?transport=tcp", "turns:bn-turn1.xirsys.com:443?transport=tcp", "turns:bn-turn1.xirsys.com:5349?transport=tcp"]
        }
    ]
}
const localVideo = document.getElementById('localVideo');
const remoteVideosContainer = document.getElementById('remoteVideosContainer');
const joinBtn = document.getElementById('joinBtn');
const peerConnections = {}; // Key: socketId, Value: RTCPeerConnection
let localStream;


const roomId = 'room1';

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then((stream) => {
        localVideo.srcObject = stream;
        localStream = stream;
    });
joinBtn.addEventListener("click", () => {
    socket.emit('join', { roomId });
    // Get camera and mic
})

// When we join, receive list of users already in the room
socket.on('all-users', async (users) => {
    console.log(users)
    for (const userId of users) {
        const peer = createPeer(userId);
        peerConnections[userId] = peer;

        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit('offer', {
            target: userId,
            offer,
            sender: socket.id,
        });
    }
});

// New user joined - wait for them to send offer
socket.on('user-connected', (userId) => {
    // No action yet — we'll handle it when we receive their offer
});

// Receive offer and respond with answer
socket.on('offer', async ({ sender, offer }) => {
    const peer = new RTCPeerConnection(iceServerConfig);
    peer.ontrack = (event) => {
        console.log(event.streams)
        addRemoteVideo(sender, event.streams[0]);
    };
    peerConnections[sender] = peer;

    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));
    await peer.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit('answer', {
        target: sender,
        answer,
        sender: socket.id,
    });



    peer.onicecandidate = (event) => {
        console.log("ecccc")
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: sender,
                candidate: event.candidate,
                sender: socket.id,
            });
        }
    };
});

// Receive answer and finalize connection
socket.on('answer', async ({ sender, answer }) => {
    const peer = peerConnections[sender];
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
});

// Receive ICE candidate and add to peer
socket.on('ice-candidate', async ({ sender, candidate }) => {
    const peer = peerConnections[sender];
    if (peer && candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
});

// Utility to create a peer connection
function createPeer(socketId) {
    const peer = new RTCPeerConnection(iceServerConfig);

    peer.ontrack = (event) => {
        addRemoteVideo(socketId, event.streams[0]);
    };

    peer.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                target: socketId,
                candidate: event.candidate,
                sender: socket.id,
            });
        }
    };

    return peer;
}

// Add video element to UI for remote user
function addRemoteVideo(socketId, stream) {
    let video = document.getElementById(`video-${socketId}`);
    console.log("called", socketId, stream)
    if (!video) {
        video = document.createElement('video');
        video.id = `video-${socketId}`;
        video.autoplay = true;
        video.playsInline = true;
        remoteVideosContainer.appendChild(video);
    }
    video.srcObject = stream;
}
