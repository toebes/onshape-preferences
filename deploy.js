const FtpDeploy = require('ftp-deploy');
const ftpDeploy = new FtpDeploy();
const settings = require('./.ftpdeploy.js');
const config = {
    user: settings.user, //'oauthexample@ftconshape.com',
    // Password optional, prompted if none given
    password: settings.password, // 'OauthSec.42@@!',
    host: settings.host, //'ftp.ftconshape.com',
    port: settings.port,
    localRoot: __dirname + '/dist',
    remoteRoot: settings.remoteRoot,
    include: ['*', '**/*', '.htaccess', '**/.htaccess'], // this would upload everything except dot files
    //include: ["*.js", "dist/*", ".*"],
    // e.g. exclude sourcemaps, and ALL files in node_modules (including dot files)
    exclude: ['example_config.php'],
    // delete ALL existing files at destination before uploading, if true
    deleteRemote: settings.deleteRemote,
    // Passive mode is forced (EPSV command is not sent)
    forcePasv: true,
    // use sftp or ftp
    sftp: false,
};
ftpDeploy
    .deploy(config)
    .then((res) => console.log('finished:', res))
    .catch((err) => console.log(err));