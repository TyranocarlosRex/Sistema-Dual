import baseConfig from '../vite.config.js';

const lanHost = process.env.LAN_HOST || '192.168.1.16';
const vitePort = Number(process.env.VITE_PORT || 5173);
const baseServer = baseConfig.server || {};
const baseHmr = typeof baseServer.hmr === 'object' ? baseServer.hmr : {};

export default {
    ...baseConfig,
    server: {
        ...baseServer,
        host: '0.0.0.0',
        port: vitePort,
        strictPort: true,
        origin: `http://${lanHost}:${vitePort}`,
        cors: true,
        hmr: {
            ...baseHmr,
            host: lanHost,
            clientPort: vitePort,
        },
    },
};
