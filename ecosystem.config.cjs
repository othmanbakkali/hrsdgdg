module.exports = {
  apps: [
    {
      name: 'oria-platform',
      script: './oria-api/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5077,
        HOST: '0.0.0.0'
      }
    }
  ]
};
