import React, { Component } from 'react';
import kurento from 'kurento-utils';
import logo from './logo.svg';
import './App.css';
import io from 'socket.io-client';
const socket = io('https://live.devarenaedge.com');

class App extends Component {

  constructor() {
    super();
    this.video = React.createRef();
    this.webRtcPeer = null;
    // this.ws =  new WebSocket('wss://localhost:8443/one2many');
  }

  componentDidMount () {
    // this.ws.onmessage = (message) => {
    //   if (message) {
    //     const parsedMessage = JSON.parse(message.data);
    //     console.log(parsedMessage);
    //     return {
    //       'presenterResponse' : () => this.presenterResponse(parsedMessage),
    //       'viewerResponse'    : () => this.viewerResponse(parsedMessage),
    //       'iceCandidate'      : () => this.webRtcPeer.addIceCandidate(parsedMessage.candidate),
    //     }[parsedMessage.id]();
    //   }
    // }~

    socket.on('iceCandidate', ({ candidate }) => {
      console.log(candidate);
      this.webRtcPeer.addIceCandidate(candidate)
    })

    socket.on('presenterResponse', (message) => {
      console.log(message);
      this.presenterResponse(message);
    })

    socket.on('viewerResponse', (message) => {
      console.log(message);
      this.viewerResponse(message);
    })
  }

  presenterResponse = (message) => {
    if (message.response !== 'accepted') {
      const errorMsg = message.message ? message.message : 'Unknow error';
      console.warn('Call not accepted for the following reason: ' + errorMsg);
    } else {
      this.webRtcPeer.processAnswer(message.sdpAnswer);
    }
  };

  viewerResponse = (message) => {
    if (message.response !== 'accepted') {
      const errorMsg = message.message ? message.message : 'Unknow error';
      console.warn('Call not accepted for the following reason: ' + errorMsg);
    } else {
      this.webRtcPeer.processAnswer(message.sdpAnswer);
    }
  };

  sendMessage = (message) => {
    const jsonMessage = JSON.stringify(message);
    // this.ws.send(jsonMessage);
  };

  onIceCandidate = (candidate) => {
    socket.emit('onIceCandidate', {
      candidate,
      room : 'test',
    })
  };

  offerPresenter = (err, sdpOffer) => {
    socket.emit('presenter', {
      sdpOffer,
      room: 'test',
    })

  };

  offerViewer = (err, sdpOffer) => {
    console.log(err);
    socket.emit('viewer', {
      sdpOffer,
      room: 'test',
    })
  };

  createRoom = () => {
    if(!this.webRtcPeer) {
      const options = {
        localVideo: this.video.current,
        onicecandidate: this.onIceCandidate,
      };

      this.webRtcPeer = kurento.WebRtcPeer.WebRtcPeerSendonly(options, (err) => {
        if (err) return console.log(err);
        this.webRtcPeer.generateOffer(this.offerPresenter);
      })
    }
  };

  joinRoom = () => {
    if(!this.webRtcPeer) {
      const options = {
        remoteVideo: this.video.current,
        onicecandidate: this.onIceCandidate,
      };

      this.webRtcPeer = kurento.WebRtcPeer.WebRtcPeerRecvonly(options, (err) => {
        if (err) return console.log(err);
        this.webRtcPeer.generateOffer(this.offerViewer);
      })
    }
  };

  close = () => {

  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>

        <div>
          <video ref={this.video} autoPlay />
          <button onClick={this.createRoom}>Create Room</button>
          <button onClick={this.joinRoom}>Join Room</button>
          <button>Close</button>
        </div>
      </div>
    );
  }
}

export default App;
