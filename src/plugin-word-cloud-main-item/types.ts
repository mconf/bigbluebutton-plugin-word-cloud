import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';

interface PluginWordCloudMainItemProps {
  pluginApi: PluginApi,
  intl: IntlShape,
}

interface WordCloudEnableData {
  enabled: boolean;
}

export {
  PluginWordCloudMainItemProps,
  WordCloudEnableData,
};
