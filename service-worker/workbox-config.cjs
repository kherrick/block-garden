module.exports = {
  globDirectory: "./",
  globPatterns: [
    "**/**.css",
    "**/**.gif",
    "**/**.html",
    "**/**.ico",
    "**/**.js",
    "**/**.json",
    "**/**.mjs",
    "**/**.png",
  ],
  globIgnores: [
    "**/bin/**",
    "**/node_modules/**",
    "**/src/**",
    "index.mjs",
    "**service-worker**/**",
    "workbox-*.cjs",
    "workbox-*.js",
  ],
  swDest: "./service-worker.js",
  sourcemap: false,
  // https://developer.chrome.com/docs/workbox/modules/workbox-build#property-BasePartial-maximumFileSizeToCacheInBytes
  maximumFileSizeToCacheInBytes: 2097152 * 3,
  // define runtime caching rules
  runtimeCaching: [
    {
      // match any request
      urlPattern: new RegExp("^.*$"),

      // apply a network-first strategy
      handler: "NetworkFirst",

      options: {
        // use a custom cache name
        cacheName: "block-garden-cache",

        expiration: {
          // 365 days
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
  ],
};
