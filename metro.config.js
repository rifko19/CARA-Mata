const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Modifikasi resolver
const updatedConfig = {
    ...config,
    resolver: {
        ...config.resolver,
        assetExts: [...config.resolver.assetExts, 'tflite'],
    }
};

module.exports = withNativeWind(updatedConfig, { input: './global.css' });