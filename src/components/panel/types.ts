import { CurrentUserData } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';

export interface WordCloudStartStopType {
  message: 'start' | 'stop';
  startFromNow?: boolean;
}

export interface PanelProps {
  intl: IntlShape;
  isActive: boolean;
  currentStartFromNow?: boolean;
  onStartStop: (data: WordCloudStartStopType) => void;
  currentUser?: CurrentUserData;
}
