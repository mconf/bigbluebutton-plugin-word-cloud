import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';

export interface PanelProps {
  pluginApi: PluginApi;
  intl: IntlShape;
}

export interface WordCloudStartStopType {
  message: 'start' | 'stop';
}
