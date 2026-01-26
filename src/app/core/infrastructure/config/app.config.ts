import { InjectionToken } from '@angular/core';

export interface NumberFormatConfig {
  decimalSeparator: string;
  thousandsSeparator: string;
}

export interface TeamsConfig {
  maxTeamsPerUser: number;
}

export interface AppConfig {
  numberFormat: NumberFormatConfig;
  teams: TeamsConfig;
}

export const APP_CONFIG: AppConfig = {
  numberFormat: {
    decimalSeparator: '.',
    thousandsSeparator: ','
  },
  teams: {
    maxTeamsPerUser: 2
  }
};

export const APP_CONFIG_TOKEN = new InjectionToken<AppConfig>('APP_CONFIG', {
  providedIn: 'root',
  factory: () => APP_CONFIG
});
