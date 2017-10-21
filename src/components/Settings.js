import {observer} from 'mobx-react';
import React, {Component} from 'react';
import storage from 'electron-json-storage-sync';
import gears from '../img/gears.svg';
import close from '../img/close.svg';

@observer
class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false,
            cameraName: this.props.store.cameraName,
            triggerTime: this.props.store.triggerTime,
            notificationType: this.props.store.notificationType,
            pushBulletApiKey: this.props.store.pushBulletApiKey,
            pushOverApiKey: this.props.store.pushOverApiKey,
            motionThreshold: this.props.store.motionThreshold
        };

        // bindings
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleInputChange(event) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    handleSubmit(event) {
        event.preventDefault();
        let saveObj = {};

        // cameraName
        if (this.state.cameraName !== this.props.store.cameraName) {
            this.props.store.cameraName = this.state.cameraName;
        }
        saveObj.cameraName = this.state.cameraName;

        // notificationType
        if (this.state.notificationType !== this.props.store.notificationType) {
            this.props.store.notificationType = this.state.notificationType;
        }
        saveObj.notificationType = this.state.notificationType;


        // pushBulletApiKey
        if (this.state.pushBulletApiKey !== this.props.store.pushBulletApiKey) {
            this.props.store.pushBulletApiKey = this.state.pushBulletApiKey;
        }
        saveObj.pushBulletApiKey = this.state.pushBulletApiKey;

        // pushOverApiKey
        if (this.state.pushOverApiKey !== this.props.store.pushOverApiKey) {
            this.props.store.pushOverApiKey = this.state.pushOverApiKey;
        }
        saveObj.pushOverApiKey = this.state.pushOverApiKey;

        // pushOverAppKey
        if (this.state.pushOverAppKey !== this.props.store.pushOverAppKey) {
            this.props.store.pushOverAppKey = this.state.pushOverAppKey;
        }
        saveObj.pushOverAppKey = this.state.pushOverAppKey;

        // motionThreshold
        if (this.state.motionThreshold !== this.props.store.motionThreshold) {
            this.props.store.motionThreshold = parseInt(this.state.motionThreshold);
        }
        saveObj.motionThreshold = parseInt(this.state.motionThreshold);

        // triggerTime
        if (this.state.triggerTime !== this.props.store.triggerTime) {
            this.props.store.triggerTime = parseInt(this.state.triggerTime);
        }
        saveObj.triggerTime = parseInt(this.state.triggerTime);

        storage.set('wms-settings', saveObj);
        this.toggleSettings();
    }

    toggleSettings() {
        const newState = !this.state.opened;
        this.setState({
            opened: newState
        })
    }

    render() {

        const settingsClass = this.state.opened ? 'settings opened' : 'settings';

        return (
            <div className={settingsClass}>
                <img className="settings-btn"
                     onClick={() => {
                         this.toggleSettings()
                     }}
                     src={this.state.opened ? close : gears}/>
                <div className="settings-head">
                    SETTINGS
                </div>
                <div className="settings-box">
                    <form onSubmit={this.handleSubmit}>
                        <div className="form-group">
                            <label>Camera Name</label>
                            <input type="text"
                                   className="form-control form-control-sm"
                                   placeholder="webcam1"
                                   onChange={this.handleInputChange}
                                   value={this.state.cameraName}
                                   name="cameraName"/>
                        </div>
                        <div className="row">
                            <div className="col">
                                <label>Motion Threshold (%)</label>
                                <input type="number"
                                       onChange={this.handleInputChange}
                                       value={this.state.motionThreshold}
                                       name="motionThreshold"
                                       className="form-control form-control-sm"
                                       placeholder="30"/>
                            </div>
                            <div className="col">
                                <label>Trigger Time (sec)</label>
                                <input type="number"
                                       onChange={this.handleInputChange}
                                       value={this.state.triggerTime}
                                       name="triggerTime"
                                       className="form-control form-control-sm"
                                       placeholder="30"/>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Notification Type</label>
                            <select className="form-control form-control-sm"
                                    onChange={this.handleInputChange}
                                    value={this.state.notificationType}
                                    name="notificationType">
                                <option value="">NONE</option>
                                {/*<option value="IFTTT">IFTTT</option>*/}
                                <option value="pushover">PushOver</option>
                            </select>
                        </div>
                        {this.state.notificationType === 'pushover' ?
                            <div>
                                <div className="form-group">
                                    <label>PushOver App Key</label>
                                    <input type="text"
                                           className="form-control form-control-sm"
                                           placeholder="ExamPleExamPleExamPle"
                                           onChange={this.handleInputChange}
                                           value={this.state.pushOverAppKey}
                                           name="pushOverAppKey"/>
                                </div>
                                <div className="form-group">
                                    <label>PushOver User Key</label>
                                    <input type="text"
                                           className="form-control form-control-sm"
                                           placeholder="ExamPleExamPleExamPle"
                                           onChange={this.handleInputChange}
                                           value={this.state.pushOverApiKey}
                                           name="pushOverApiKey"/>
                                </div>
                            </div>
                            : null}
                        <button type="submit" className="btn btn-primary btn-sm">Save</button>
                    </form>
                </div>
            </div>
        )
    }
}

export default Settings;
