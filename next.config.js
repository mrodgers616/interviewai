/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        assert: false,
      };
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:crypto': 'crypto-browserify',
      'node:stream': 'stream-browserify',
      'node:util': 'util',
      'node:buffer': 'buffer',
      'node:assert': 'assert',
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      })
    );

    const async_hooks = eval("typeof window === 'undefined' && require('async_hooks')");
    if (async_hooks) {
      // Add any specific configuration for async_hooks here if needed
    }

    return config;
  },
}

module.exports = nextConfig
