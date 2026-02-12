module.exports = {
  apps: [
    {
      name: "ccrm",
      script: ".next/standalone/server.js",
      cwd: "/var/www/ccrm",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      error_file: "/var/www/ccrm/logs/error.log",
      out_file: "/var/www/ccrm/logs/output.log",
      merge_logs: true,
      time: true,
    },
  ],
}
