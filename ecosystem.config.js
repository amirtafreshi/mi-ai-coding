module.exports = {
  apps: [{
    name: 'mi-ai-coding',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/master/projects/mi-ai-coding',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 3002,
      APP_PORT: 3002,
      WS_PORT: 3003,
    },
    error_file: '/home/master/projects/mi-ai-coding/logs/error.log',
    out_file: '/home/master/projects/mi-ai-coding/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
  }]
}
