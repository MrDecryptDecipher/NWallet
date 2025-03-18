module.exports = {
  apps: [{
    name: 'nwallet-api',
    script: 'api-server.js',
    node_args: '--experimental-modules --es-module-specifier-resolution=node',
    env: {
      NODE_ENV: 'development',
      PORT: 5174
    },
    error_file: '/home/ubuntu/Sandeep/projects/Nwallet/logs/api-error.log',
    out_file: '/home/ubuntu/Sandeep/projects/Nwallet/logs/api-out.log'
  }]
} 