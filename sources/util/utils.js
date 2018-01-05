'use strict';

module.exports = {
    catchSessionOpen: error => {
        console.error('Failed to open session and/or retrieve the app list:', error);
        process.exit(1);
    },
    
    genericCatch: error => {
        session.close();
        console.error('Error occured:', error);
    },
    
    dateFromQlikNumber: (n) => {
        // return: Date from QlikView number
        var d = new Date(Math.round((n - 25569) * 86400 * 1000));
        // since date was created in UTC shift it to the local timezone
        d.setTime(d.getTime() + d.getTimezoneOffset() * 60 * 1000);
        return d;
    }
    
}