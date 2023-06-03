// Change the settings in here and then rename this file to be .ftpdeploy.js
const settings = {
    user: 'user@host.com', // <--- Change this to your username
    password: '<your password>', // <-- Change this to your password
    host: 'ftp.host.com', // <-- Change this to the host
    port: 21, // Change this if needed
    remoteRoot: '/', // Change this if you have a different place than the root to deploy to
    deleteRemote: false, // Change if you want to delete everything there first
};
module.exports = settings;