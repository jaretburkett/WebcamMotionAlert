const pushover = require( 'pushover-notifications' );

function sendPushover(isMotionOn, store){

    const p = new pushover( {
        user: store.pushOverApiKey,
        token: store.pushOverAppKey
    });
    let msg = {
        // These values correspond to the parameters detailed on https://pushover.net/api
        // 'message' is required. All other values are optional.
        message: '',	// required
        title: "Webcam Motion Alert",
        sound: 'magic',
        priority: 1
    };

    if(isMotionOn){
        msg.message = store.cameraName + ' - Motion DETECTED'
    } else {
        // motion off
        msg.message = store.cameraName + ' - Motion STOPPED'
    }

    p.send( msg, function( err, result ) {
        if ( err ) {
            throw err;
        }

        console.log( result );
    });
}

const motionOn = (store) => {
    // pushover
    if(store.notificationType ==='pushover' && store.pushOverApiKey !== '' && store.pushOverAppKey !== ''){
        sendPushover(true, store);
    }
};
const motionOff = (store) => {
    // pushover
    if(store.notificationType ==='pushover' && store.pushOverApiKey !== '' && store.pushOverAppKey !== ''){
        sendPushover(false, store);
    }
};

module.exports.motionOn = motionOn;
module.exports.motionOff = motionOff;