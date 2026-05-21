const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Bundle .html assets (assets/pdfjs/viewer.html for the in-app PDF viewer).
// Required so `require('@/assets/pdfjs/viewer.html')` resolves at build time
// and Asset.fromModule(...) can give us a localUri for the WebView.
config.resolver.assetExts = [...config.resolver.assetExts, "html"];

module.exports = withNativeWind(config, { input: "./global.css" });
