const { getDefaultConfig } = require('expo/metro-config')
const { withUniwindConfig } = require('uniwind/metro') // make sure this import exists
const path = require('path')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

// Add Node.js polyfill resolvers for jose/privy
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  crypto: require.resolve('react-native-quick-crypto'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
  util: require.resolve('util'),
  zlib: require.resolve('browserify-zlib'),
  events: require.resolve('events'),
  assert: require.resolve('assert'),
  process: require.resolve('process/browser'),
}

// Force jose to use browser build instead of Node.js build
const originalResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect jose Node.js build to browser build
  if (moduleName === 'jose' || moduleName.startsWith('jose/')) {
    const browserPath = path.resolve(
      __dirname,
      'node_modules/jose/dist/browser/index.js',
    )
    return {
      filePath: browserPath,
      type: 'sourceFile',
    }
  }

  // Redirect uuid to ESM browser build (fixes wrapper.mjs CJS import on web)
  if (platform === 'web' && (moduleName === 'uuid' || moduleName.startsWith('uuid/'))) {
    const uuidPath = path.resolve(
      __dirname,
      'node_modules/uuid/dist/esm-browser/index.js',
    )
    return {
      filePath: uuidPath,
      type: 'sourceFile',
    }
  }

  // Use default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

// Apply uniwind modifications before exporting
const uniwindConfig = withUniwindConfig(config, {
  // relative path to your global.css file
  cssEntryFile: './src/global.css',
  // optional: path to typings
  dtsFile: './src/uniwind-types.d.ts',
})

module.exports = uniwindConfig
