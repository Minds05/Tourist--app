const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Audio formats
  "wav",
  "mp3",
  "aac",
  "m4a",
  // Video formats
  "mp4",
  "mov",
  "avi",
  // 3D model formats
  "glb",
  "gltf",
  // Font formats
  "ttf",
  "otf",
  "woff",
  "woff2",
)

// Configure source extensions
config.resolver.sourceExts.push("jsx", "js", "ts", "tsx", "json")

// Configure transformer for React Native
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer")
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg")
config.resolver.sourceExts.push("svg")

module.exports = config
