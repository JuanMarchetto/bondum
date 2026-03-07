const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Removes SYSTEM_ALERT_WINDOW permission from AndroidManifest.xml
 * This permission is typically added by expo-dev-client for development tools,
 * but is not needed for production builds and raises security concerns.
 */
const withRemoveSystemAlertWindow = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (manifest['uses-permission']) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (permission) => {
          const name = permission.$['android:name'];
          return name !== 'android.permission.SYSTEM_ALERT_WINDOW';
        }
      );
    }

    return config;
  });
};

module.exports = withRemoveSystemAlertWindow;

