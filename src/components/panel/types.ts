import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';

export interface WordCloudStartStopType {
  message: 'start' | 'stop';
  startFromNow?: boolean;
}

export interface PanelProps {
  pluginApi: PluginApi;
  intl: IntlShape;
  isActive: boolean;
  onStartStop: (data: WordCloudStartStopType) => void;
}
