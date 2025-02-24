import Taro from '@tarojs/taro';
import { getRemoteSettings } from '../api/api';
import { ParsedSettings, RemoteSetting } from '../types/remoteSettings';

const SETTINGS_STORAGE_KEY = 'app_remote_settings';
const SETTINGS_TIMESTAMP_KEY = 'app_remote_settings_timestamp';
const API_TIMEOUT = 9000; // 9 seconds timeout
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class RemoteSettingsService {
  private static instance: RemoteSettingsService;
  private settings: ParsedSettings = {};
  private initialized = false;

  private constructor() {}

  static getInstance(): RemoteSettingsService {
    if (!RemoteSettingsService.instance) {
      RemoteSettingsService.instance = new RemoteSettingsService();
    }
    return RemoteSettingsService.instance;
  }

  private parseSettingValue(setting: RemoteSetting): any {
    try {
      if (!setting?.value) return setting.default_value;

      switch (setting.data_type) {
        case "BOOL":
          return setting.value.toLowerCase() === "true";
        case "INT":
          return parseInt(setting.value, 10);
        case "FLOAT":
          return parseFloat(setting.value);
        case "LIST":
          try {
            const parsed = JSON.parse(setting.value);
            return Array.isArray(parsed) ? parsed.map(String) : [];
          } catch {
            return [];
          }
        case "JSON":
          return JSON.parse(setting.value);
        case "STRING":
        default:
          return setting.value;
      }
    } catch (error) {
      console.error(`Error parsing setting ${setting.config_key}:`, error);
      return setting.default_value;
    }
  }

  private async fetchRemoteSettings(): Promise<RemoteSetting[] | null> {
    try {
      const response = await getRemoteSettings();
      return response as RemoteSetting[];
    } catch (error) {
      // Check for specific network error
      if (error instanceof Error && error.message.includes('Network Error')) {
        console.error('Network connectivity issue:', error);
        Taro.showToast({
          title: '网络连接失败，请检查网络',
          icon: 'none',
          duration: 3000
        });
      } else {
        const errorMessage = this.getErrorMessage(error);
        console.error('Error fetching remote settings:', error);
        
        Taro.showToast({
          title: errorMessage,
          icon: 'none',
          duration: 2000
        });
      }

      // Add retry logic
      const retryCount = 3;
      const retryDelay = 1000; // 1 second

      for (let i = 0; i < retryCount; i++) {
        try {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          const retryResponse = await getRemoteSettings();
          return retryResponse as RemoteSetting[];
        } catch (retryError) {
          console.error(`Retry ${i + 1} failed:`, retryError);
        }
      }

      return null;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      switch (error.message) {
        case "TIMEOUT":
          return "网络超时，请重试";
        case "INVALID_RESPONSE":
          return "服务器响应异常";
        default:
          return "加载设置失败";
      }
    }
    return "加载设置失败";
  }

  private isCacheValid(): boolean {
    try {
      const timestamp = Taro.getStorageSync(SETTINGS_TIMESTAMP_KEY);
      if (!timestamp) return false;

      const lastUpdate = new Date(timestamp).getTime();
      return Date.now() - lastUpdate < CACHE_DURATION;
    } catch {
      return false;
    }
  }

  private async loadLocalSettings(): Promise<ParsedSettings | null> {
    try {
      if (!this.isCacheValid()) return null;

      const stored = Taro.getStorageSync(SETTINGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error loading local settings:", error);
      return null;
    }
  }

  private saveLocalSettings(settings: ParsedSettings): void {
    try {
      Taro.setStorageSync(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      Taro.setStorageSync(SETTINGS_TIMESTAMP_KEY, new Date().toISOString());
    } catch (error) {
      console.error("Error saving local settings:", error);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try loading from cache first in case of network issues
      const cachedSettings = await this.loadLocalSettings();
      
      // Attempt to fetch remote settings
      const remoteData = await this.fetchRemoteSettings();
      
      if (!remoteData?.length) {
        // If remote fetch fails, use cached settings
        this.settings = cachedSettings || {};
        this.initialized = true;
        
        if (!cachedSettings) {
          console.warn('No cached settings available after remote fetch failure');
        }
        return;
      }

      // Process remote settings
      const parsedSettings: ParsedSettings = {};
      remoteData.forEach((setting) => {
        if (setting?.is_active && setting?.config_key) {
          parsedSettings[setting.config_key] = this.parseSettingValue(setting);
        }
      });

      // Update both memory and storage
      this.settings = parsedSettings;
      this.saveLocalSettings(parsedSettings);
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing remote settings:', error);
      // Fallback to cached settings in case of complete failure
      const cachedSettings = await this.loadLocalSettings();
      this.settings = cachedSettings || {};
      this.initialized = true;
      
      Taro.showToast({
        title: '使用缓存设置',
        icon: 'none',
        duration: 2000
      });
    }
  }

  getValue<T>(key: string, defaultValue: T): T {
    if (!this.initialized) {
      console.warn("RemoteSettings not initialized, using default value");
      return defaultValue;
    }
    return this.settings[key] ?? defaultValue;
  }

  getAllSettings(): ParsedSettings {
    if (!this.initialized) {
      console.warn("RemoteSettings not initialized, returning empty object");
      return {};
    }
    return { ...this.settings };
  }

  // Type-specific getter methods
  getBool(key: string, defaultValue = false): boolean {
    const value = this.getValue(key, defaultValue);
    return typeof value === "boolean" ? value : defaultValue;
  }

  getString(key: string, defaultValue = ""): string {
    const value = this.getValue(key, defaultValue);
    return typeof value === "string" ? value : defaultValue;
  }

  getInt(key: string, defaultValue = 0): number {
    const value = this.getValue(key, defaultValue);
    return typeof value === "number" && Number.isInteger(value)
      ? value
      : defaultValue;
  }

  getFloat(key: string, defaultValue = 0.0): number {
    const value = this.getValue(key, defaultValue);
    return typeof value === "number" ? value : defaultValue;
  }

  getList(key: string, defaultValue: string[] = []): string[] {
    const value = this.getValue(key, defaultValue);
    return Array.isArray(value) ? value.map(String) : defaultValue;
  }

  getJSON<T>(key: string, defaultValue: T): T {
    const value = this.getValue(key, defaultValue);
    return value as T;
  }
} 