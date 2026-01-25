import { InjectionToken } from '@angular/core';

export interface NumberFormatConfig {
  decimalSeparator: string;
  thousandsSeparator: string;
}

export interface AppConfig {
  numberFormat: NumberFormatConfig;
}

export const APP_CONFIG: AppConfig = {
  numberFormat: {
    decimalSeparator: '.',
    thousandsSeparator: ','
  }
};

export const APP_CONFIG_TOKEN = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => APP_CONFIG
});
