export type DataType = 'BOOL' | 'INT' | 'FLOAT' | 'STRING' | 'LIST' | 'JSON';
export type Platform = 'ALL' | 'IOS' | 'ANDROID' | 'WEB';

export interface RemoteSetting {
  id: number;
  config_key: string;
  data_type: DataType;
  value: string;
  default_value: string;
  category: string;
  platform: Platform;
  is_active: boolean;
  description?: string;
  last_modified: number;
}

export interface RemoteSettingsResponse {
  messageCode: number;
  message: string;
  resultData: RemoteSetting[];
}

export interface ParsedSettings {
  [key: string]: any;
} 