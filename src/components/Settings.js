import {observer} from 'mobx-react';
import React, {Component} from 'react';
import gears from '../img/gears.svg';
import close from '../img/close.svg';

@observer
class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            opened: false
        };

        // bindings
        // this.toggleSettings = this.toggleSettings.bind(this);
    }

    toggleSettings() {
        const newState = !this.state.opened;
        this.setState({
            opened: newState
        })
    }

    componentDidMount() {

    }

    render() {

        const settingsClass = this.state.opened ? 'settings opened' : 'settings';

        return (
            <div className={settingsClass}>
                <img className="settings-btn"
                     onClick={() => {this.toggleSettings()}}
                     src={this.state.opened ? close : gears}/>
                <div className="settings-head">
                    SETTINGS
                </div>
                <div className="settings-box">
                </div>
            </div>
        )
    }
}

export default Settings;
