require('path');
module.exports = {
  apps: [{
    script: 'index.js',
    name: 'roomsy', // Your entry point
    autorestart: true,
    watch: true,
    ignore_watch: ['node_modules', '*.log', '.git', '.idea', 'roombelt.sqlite'],
    max_memory_restart: '256M',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    watch_options: {
      usePolling: true
    }
  }]
};
