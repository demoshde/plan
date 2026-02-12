module.exports = {
  apps: [{
    name: 'convoy-api',
    script: 'src/index.js',
    cwd: '/var/www/convoy/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 5001,
      MONGODB_URI: 'mongodb://localhost:27017/ot-mining-logistics'
    }
  }]
};
