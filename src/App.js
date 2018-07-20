import React, { Component } from 'react';
import kurento from 'kurento-utils';
import logo from './logo.svg';
import './App.css';

class App extends Component {

  constructor() {
    super();
    this.video = React.createRef();
    this.webRtcPeer = null;
    this.ws =  new WebSocket('wss://5e1b6646.ngrok.io/one2many');
  }

  componentDidMount () {
    this.ws.onmessage = (message) => {
      if (message) {
        const parsedMessage = JSON.parse(message.data);
        console.log(parsedMessage);
        return {
          'presenterResponse' : () => this.presenterResponse(parsedMessage),
          'viewerResponse'    : () => this.viewerResponse(parsedMessage),
          'iceCandidate'      : () => this.webRtcPeer.addIceCandidate(parsedMessage.candidate),
        }[parsedMessage.id]();
      }
    }
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
    this.ws.send(jsonMessage);
  };

  onIceCandidate = (candidate) => {
    const message = {
      id : 'onIceCandidate',
      candidate,
    };
    this.sendMessage(message);
  };

  offerPresenter = (err, sdpOffer) => {
    const message = {
      id : 'presenter',
      sdpOffer,
    };
    this.sendMessage(message);
  };

  offerViewer = (err, sdpOffer) => {
    console.log(err);
    const message = {
      id : 'viewer',
      sdpOffer,
    };
    this.sendMessage(message);
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
          <video ref={this.video} />
          <button onClick={this.createRoom}>Create Room</button>
          <button onClick={this.joinRoom}>Join Room</button>
          <button>Close</button>
        </div>
      </div>
    );
  }
}

export default App;
