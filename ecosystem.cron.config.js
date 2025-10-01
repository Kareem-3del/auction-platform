module.exports = {
  apps: [
    {
      name: 'auction-status-cron',
      script: './cron/update-auction-status.js',
      cron_restart: '* * * * *', // Run every minute
      autorestart: false, // Don't auto-restart on crashes when using cron
      watch: false,
      env: {
        API_URL: 'https://auction.lebanon-auction.bdaya.tech',
      },
    },
  ],
};
