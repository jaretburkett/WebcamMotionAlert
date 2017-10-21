import {autorun, observable} from 'mobx';
import storage from 'electron-json-storage-sync';
const result = storage.get('wms-settings');

function get(key,defaultValue){
    if (result.status) {
        return result.data[key];
    } else {
        // console.log(result.error );
        return defaultValue
    }
}


class Store {
    @observable motionThreshold = get('motionThreshold', 30);
    @observable triggerTime = get('triggerTime', 30);
    @observable cameraName = get('cameraName', 'webcam1');
    @observable notificationType = get('notificationType', '');
    @observable pushBulletApiKey = get('pushBulletApiKey', '');
    @observable pushOverAppKey = get('pushOverAppKey', '');
    @observable pushOverApiKey = get('pushOverApiKey', '');
}

let store = window.store = new Store;

export default store;

autorun(()=>{
});