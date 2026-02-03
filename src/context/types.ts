import { MeetingClientSettings } from 'bigbluebutton-html-plugin-sdk/dist/cjs/core/api/types';

export interface Settings {
  panelImageUrl?: string,
}

export interface ClientSettings extends MeetingClientSettings {
  public: MeetingClientSettings['public'] & {
    plugins?: [{ name?: string, settings?: Settings }];
  }
}
