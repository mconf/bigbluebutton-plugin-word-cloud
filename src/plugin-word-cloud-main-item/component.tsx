import * as React from 'react';
import { useEffect, useRef } from 'react';

import {
  DataChannelTypes,
  GenericContentMainArea,
  MediaAreaOption,
  IntlLocaleUiDataNames,
  RESET_DATA_CHANNEL,
} from 'bigbluebutton-html-plugin-sdk';
import * as ReactDOM from 'react-dom/client';
import { PluginWordCloudMainItemProps, WordCloudEnableData } from './types';
import { PluginWordCloud } from '../plugin-word-cloud/component';
import { intlMessages } from '../intlMessages';

const WORD_CLOUD_ENABLE_CHANNEL = 'WordCloudEnableChannel';

function SampleGenericContentMainPlugin(
  { pluginApi, intl }: PluginWordCloudMainItemProps,
): React.ReactNode {
  const {
    data: wordCloudEnable,
    pushEntry: pushWordCloudEnable,
    deleteEntry: deleteWordCloudEnable,
  } = pluginApi.useDataChannel<WordCloudEnableData>(
    WORD_CLOUD_ENABLE_CHANNEL,
    DataChannelTypes.LATEST_ITEM,
  );

  const { data: currentUser } = pluginApi.useCurrentUser();

  const currentLocale = pluginApi.useUiData(IntlLocaleUiDataNames.CURRENT_LOCALE, {
    locale: 'en',
    fallbackLocale: 'en',
  });

  const genericContentId = useRef<string>('');

  // Setup plugin button
  useEffect(() => {
    if (currentUser?.role === 'MODERATOR' || currentUser?.presenter) {
      const enabled = wordCloudEnable?.data
        && wordCloudEnable?.data[0]?.payloadJson.enabled;
      pluginApi.setMediaAreaItems([
        new MediaAreaOption({
          label: enabled
            ? intl.formatMessage(intlMessages.stopSharing)
            : intl.formatMessage(intlMessages.title),
          icon: {
            svgContent:
            enabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
            ) as React.SVGProps<SVGSVGElement>,
          },
          tooltip: enabled
            ? intl.formatMessage(intlMessages.stopSharing)
            : intl.formatMessage(intlMessages.tooltip),
          allowed: true,
          onClick: enabled ? () => {
            deleteWordCloudEnable([RESET_DATA_CHANNEL]);
          } : () => {
            pushWordCloudEnable({ enabled: true });
          },
        }),
      ]);
    } else {
      pluginApi.setMediaAreaItems([]);
    }
  }, [currentUser, wordCloudEnable, currentLocale]);

  useEffect(() => {
    const enabled = wordCloudEnable?.data
        && wordCloudEnable?.data[0]?.payloadJson.enabled;
    if (enabled) {
      [genericContentId.current] = pluginApi.setGenericContentItems([
        new GenericContentMainArea({
          id: genericContentId.current,
          contentFunction: (element: HTMLElement) => {
            const root = ReactDOM.createRoot(element);
            root.render(
              <React.StrictMode>
                <PluginWordCloud
                  pluginApi={pluginApi}
                  intl={intl}
                />
              </React.StrictMode>,
            );
            return root;
          },
        }),
      ]);
    } else {
      pluginApi.setGenericContentItems([]);
    }
  }, [wordCloudEnable, currentLocale]);

  return null;
}

export default SampleGenericContentMainPlugin;
