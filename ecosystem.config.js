module.exports = {
  apps: [
    {
      name: 'auction-platform',
      script: 'npm start',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/home/ubuntu/auction-platform',
      env: {
        NODE_ENV: 'production',
        PORT: 8083,
      },
      error_file: '/home/ubuntu/.pm2/logs/auction-platform-error.log',
      out_file: '/home/ubuntu/.pm2/logs/auction-platform-out.log',
      log_file: '/home/ubuntu/.pm2/logs/auction-platform-combined.log',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      autorestart: true,
      max_memory_restart: '1G',
      kill_timeout: 5000,
    },
    {
      name: 'websocket-server',
      script: './websocket-server.js',
      instances: 1,
      exec_mode: 'fork',
      cwd: '/home/ubuntu/auction-platform',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 8081,
        WS_SSL: 'false',
      },
      error_file: '/home/ubuntu/.pm2/logs/websocket-server-error.log',
      out_file: '/home/ubuntu/.pm2/logs/websocket-server-out.log',
      log_file: '/home/ubuntu/.pm2/logs/websocket-server-combined.log',
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      autorestart: true,
      max_memory_restart: '500M',
      kill_timeout: 5000,
    }
  ]
};