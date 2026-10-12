/** Questions about the device the app runs on. The UI layer provides the implementation. */
export abstract class DevicePlatform {
  /** True inside the native iOS or Android shell, false in a browser or an installed web app. */
  abstract isNativeApp(): boolean;
  /** True on iOS devices, native app or browser. */
  abstract isIos(): boolean;
  /** True on Android devices, native app or browser. */
  abstract isAndroid(): boolean;
}
