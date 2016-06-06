var path = require('path')

var certPath = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates'

var config = {
    port: 1338,
    enginePort: 4747,
    hostfile: 'C:/ProgramData/Qlik/Sense/Host.cfg',
    engineuser: 'UserDirectory=Internal;UserId=sa_repository',
    certificates: {
        client: path.resolve(certPath, 'client.pem'),
        server: path.resolve(certPath, 'server.pem'),
        root: path.resolve(certPath, 'root.pem'),
        client_key: path.resolve(certPath, 'client_key.pem'),
        server_key: path.resolve(certPath, 'server_key.pem')
    }
};

module.exports = config;