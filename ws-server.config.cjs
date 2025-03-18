module.exports = {
  apps: [{
    name: 'nwallet-ws',
    script: 'server.js',
    cwd: '/home/ubuntu/Sandeep/projects/Nwallet',
    env: {
      NODE_ENV: 'development',
      PORT: 5176,
      WS_PORT: 5176,
      HOST: '0.0.0.0'
    },
    error_file: '/home/ubuntu/Sandeep/projects/Nwallet/logs/ws-error.log',
    out_file: '/home/ubuntu/Sandeep/projects/Nwallet/logs/ws-output.log',
    max_memory_restart: '500M',
    restart_delay: 4000,
    max_restarts: 10
  }]
} 