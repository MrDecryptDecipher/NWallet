module.exports = {
  apps: [{
    name: 'vite-app',
    script: 'npx',
    args: 'serve -s dist -l 5173',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
