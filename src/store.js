import {autorun, observable} from 'mobx';

class Store {
    @observable motionThreshold = 40;
    @observable triggerTime = 30;
}

let store = window.store = new Store;

export default store;

autorun(()=>{
});