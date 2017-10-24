import {observer} from 'mobx-react';
import React, {Component} from 'react';
import {init, start} from './tools/DiffCamEngine';
import SendNotification from './tools/SendNotification';
import './scss/App.scss';
import Settings from "./components/Settings";

@observer
class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            img: null,
            score: 0,
            secondsSinceLastMotion:999999
        };

        this.initError = this.initError.bind(this);
        this.initSuccess = this.initSuccess.bind(this);
        this.capture = this.capture.bind(this);
        this.tickSecond = this.tickSecond.bind(this);
    }
    getColor(value){
        //value from 0 to 100
        value = value * 0.01;
        var hue=((1-value)*120).toString(10);
        return ["hsl(",hue,",100%,50%)"].join("");
    }

    initSuccess() {
        start();
    }

    initError() {
        alert('Something went wrong.');
    }

    capture(payload) {
        this.setState({
            score: payload.score
        });

        // check if we have motion
        if(payload.score > this.props.store.motionThreshold){
            // check if we have new motion
            if(this.state.secondsSinceLastMotion > this.props.store.triggerTime) {
                // new motion
                SendNotification.motionOn(this.props.store);
            }
            this.setState({
               secondsSinceLastMotion:0
            });
        }
    }

    // called every second
    tickSecond(){
        const setSecond = this.state.secondsSinceLastMotion + 1;
        this.setState({
            secondsSinceLastMotion:setSecond
        });
        if(setSecond === this.props.store.triggerTime){
            // motion has stopped
            SendNotification.motionOff(this.props.store);
        }
    }

    componentDidMount() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('motion');

        init({
            video: video,
            motionCanvas: canvas,
            initSuccessCallback: this.initSuccess,
            initErrorCallback: this.initError,
            captureCallback: this.capture
        });

        setInterval(() =>{
            this.tickSecond();
        },1000);
    }

    render() {
        let score = this.state.score;
        let secondsSinceLastMotion = this.state.secondsSinceLastMotion;
        let triggerTime = this.props.store.triggerTime;

        if(score > 100){
            score = 100;
        }

        const motionBarStyle = {
            width:score+'%',
            background:this.getColor(score)
        };

        const thresholdStyle = {
           width:this.props.store.motionThreshold + '%'
        };


        if(secondsSinceLastMotion > triggerTime){
            secondsSinceLastMotion = '>'+triggerTime;
        }

        return (
            <div style={{height:'100%'}}>
                <div className="frame">
                    <div className="box">
                        <video id="video"></video>
                        <canvas id="motion"></canvas>
                    </div>
                    <div className="last-motion-box">
                        <div className="title">
                            Last Motion
                        </div>
                        <div className="number">
                            {secondsSinceLastMotion}
                        </div>
                        <div className="bottom">
                            SECONDS
                        </div>
                    </div>
                    <Settings store={this.props.store}/>
                </div>

                <div className="footer">
                    <div className="motionbar" style={motionBarStyle}>
                    </div>
                    <div className="threshold" style={thresholdStyle}></div>
                    {/*Score: <span id="score">{this.state.score}</span>*/}
                </div>
            </div>
        )
    }
}

export default App;
