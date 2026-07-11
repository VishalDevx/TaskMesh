module.exports = {
  apps: [
    {
      name: 'taskmesh-next',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '300M',
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'taskmesh-socket',
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '200M',
      instances: 1,
      autorestart: true,
      watch: false,
    },
    {
      name: 'taskmesh-workers',
      script: 'node_modules/.bin/tsx',
      args: 'workers/index.ts',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '150M',
      instances: 1,
      autorestart: true,
      watch: false,
    },
  ],
};
