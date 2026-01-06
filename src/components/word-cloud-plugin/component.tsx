import * as React from 'react';
import { useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom/client';
import {
  GenericContentSidekickArea,
  GenericContentMainArea,
  IntlLocaleUiDataNames,
  pluginLogger,
} from 'bigbluebutton-html-plugin-sdk';
import { WordCloudPluginProps } from './types';
import { intlMessages } from '../../intlMessages';
import Panel from '../panel/component';
import { PluginWordCloud } from '../../plugin-word-cloud/component';
import { useWordCloudStore } from '../../context/WordCloudStore';

const NAVIGATION_SIDEBAR_BUTTON_ICON = 'plugin';

function WordCloudPlugin({ pluginApi, intl }: WordCloudPluginProps): React.ReactNode {
  const currentLocale = pluginApi.useUiData(IntlLocaleUiDataNames.CURRENT_LOCALE, {
    locale: 'en',
    fallbackLocale: 'en',
  });

  const sidekickContentId = useRef<string | undefined>('');
  const mainAreaContentId = useRef<string | undefined>('');

  const { isActive } = useWordCloudStore();

  pluginLogger.info('WordCloudPlugin - isActive:', isActive);

  useEffect(() => {
    pluginLogger.info('WordCloudPlugin - useEffect triggered, isActive:', isActive);
    const sidekickArea = new GenericContentSidekickArea({
      contentFunction: (element: HTMLElement) => {
        const root = ReactDOM.createRoot(element);
        root.render(
          <React.StrictMode>
            <Panel intl={intl} pluginApi={pluginApi} />
          </React.StrictMode>,
        );
        return root;
      },
      name: intl.formatMessage(intlMessages.title),
      section: intl.formatMessage(intlMessages.navBarTitle),
      open: false,
      buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
      ...(sidekickContentId.current && { id: sidekickContentId.current }),
    });

    const items: (GenericContentSidekickArea | GenericContentMainArea)[] = [sidekickArea];

    if (isActive) {
      const mainArea = new GenericContentMainArea({
        ...(mainAreaContentId.current && { id: mainAreaContentId.current }),
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
      });
      items.push(mainArea);
    }

    const generatedIds = pluginApi.setGenericContentItems(items);
    [sidekickContentId.current] = generatedIds;
    if (isActive && generatedIds.length > 1) {
      [, mainAreaContentId.current] = generatedIds;
    } else {
      mainAreaContentId.current = undefined;
    }
  }, [
    intl.formatMessage(intlMessages.title),
    intl.formatMessage(intlMessages.navBarTitle),
    currentLocale,
    isActive,
  ]);

  return null;
}

export default WordCloudPlugin;
