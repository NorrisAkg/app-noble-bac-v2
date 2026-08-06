const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Le dex merge (D8/R8) tourne dans le daemon Gradle lui-même, donc le `-Xmx2048m` du template Expo
 * est le plafond effectif de `:app:mergeDexRelease`. Sur une machine chargée ça part en
 * `OutOfMemoryError: Java heap space`, et l'échec collatéral `:app:mergeReleaseJavaResource`
 * (« Failed to obtain compression information for entry ») est le symptôme de la même saturation.
 *
 * `android/` étant régénéré par `expo prebuild` à chaque build, ces valeurs ne peuvent pas vivre
 * dans `android/gradle.properties` — d'où ce plugin.
 */
const GRADLE_PROPERTIES = {
  // Heap du dex merge + Metaspace (le daemon signalait aussi son épuisement).
  'org.gradle.jvmargs': '-Xmx4096m -XX:MaxMetaspaceSize=1024m',
  // Évite N workers concurrents dans la même JVM que le dex merge.
  'org.gradle.parallel': 'false',
  // Borne la concurrence NDK : 8 cœurs => 8 clang++ à ~300 Mo pièce.
  'org.gradle.workers.max': '2',
  // Les téléphones Android réels seulement : divise ~par 2 le travail natif et le volume à dexer.
  // Pour tester sur un émulateur x86 : ajouter -PreactNativeArchitectures=x86_64 au build.
  reactNativeArchitectures: 'arm64-v8a,armeabi-v7a',
};

module.exports = function withBuildMemory(config) {
  return withGradleProperties(config, (gradleConfig) => {
    for (const [key, value] of Object.entries(GRADLE_PROPERTIES)) {
      const existing = gradleConfig.modResults.find(
        (item) => item.type === 'property' && item.key === key
      );

      if (existing) {
        existing.value = value;
      } else {
        gradleConfig.modResults.push({ type: 'property', key, value });
      }
    }

    return gradleConfig;
  });
};
