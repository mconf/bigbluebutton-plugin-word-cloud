import { CurrentUserData } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';

export interface WordCloudStartStopType {
  message: 'start' | 'stop';
  startFromNow?: boolean;
}

export interface WordCloudSettingsType {
  startFromNow: boolean;
}

export interface PanelProps {
  intl: IntlShape;
  isActive: boolean;
  currentStartFromNow?: boolean;
  syncedStartFromNow?: boolean;
  onStartStop: (data: WordCloudStartStopType) => void;
  onSettingsChange: (data: WordCloudSettingsType) => void;
  currentUser?: CurrentUserData;
}
