/** @type {import('pm2').Config} */
module.exports = {
  apps: [
    {
      name: 'nwallet-api',
      script: 'api-server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5177,
        WS_PORT: 5176,
        NFTGEN_PORT: 5175,
        NIJA_WALLET_PORT: 5174
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log'
    },
    {
      name: 'nwallet-ws',
      script: 'ws-server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5176,
        NFTGEN_PORT: 5175,
        NIJA_WALLET_PORT: 5174
      },
      error_file: './logs/ws-error.log',
      out_file: './logs/ws-out.log'
    },
    {
      name: 'nwallet-frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        NODE_ENV: 'production',
        PORT: 5174
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log'
    }
  ]
};
