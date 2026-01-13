import * as React from 'react';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import * as ReactDOM from 'react-dom/client';
import {
  GenericContentSidekickArea,
  GenericContentMainArea,
  IntlLocaleUiDataNames,
  DataChannelTypes,
} from 'bigbluebutton-html-plugin-sdk';
import { WordCloudPluginProps } from './types';
import { intlMessages } from '../../intlMessages';
import Panel from '../panel/component';
import { PluginWordCloud } from '../../plugin-word-cloud/component';
import { WordCloudChannel, WordCloudSubChannels } from '../enums';
import { WordCloudStartStopType } from '../panel/types';

const NAVIGATION_SIDEBAR_BUTTON_ICON = 'cloud';
const FADE_DURATION = 200; // ms

function WordCloudPlugin({ pluginApi, intl }: WordCloudPluginProps): React.ReactNode {
  const {
    data: wordCloudStartStop,
    pushEntry: wordCloudStartStopDispatcher,
  } = pluginApi.useDataChannel<WordCloudStartStopType>(
    WordCloudChannel.WORDCLOUD,
    DataChannelTypes.LATEST_ITEM,
    WordCloudSubChannels.START_STOP,
  );

  const currentLocale = pluginApi.useUiData(IntlLocaleUiDataNames.CURRENT_LOCALE, {
    locale: 'en',
    fallbackLocale: 'en',
  });

  // Refs for content IDs and React roots
  const sidekickContentId = useRef<string | undefined>('');
  const mainAreaContentId = useRef<string | undefined>('');
  const sidekickRootRef = useRef<ReactDOM.Root | null>(null);
  const mainAreaRootRef = useRef<ReactDOM.Root | null>(null);
  const mainAreaElementRef = useRef<HTMLElement | null>(null);

  // State tracking refs
  const prevIsActiveRef = useRef<boolean | undefined>(undefined);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Derive isActive from the data channel
  const dataChannelEntry = wordCloudStartStop?.data?.[0];
  const payloadJson = dataChannelEntry?.payloadJson;
  const isActive = payloadJson?.message === 'start';
  const currentStartFromNow = payloadJson?.startFromNow;

  // Use the createdAt timestamp from the data channel entry when startFromNow is enabled
  // This ensures all users see the same timestamp regardless of when they joined
  let activatedAt: number | undefined;
  if (isActive && currentStartFromNow && dataChannelEntry?.createdAt) {
    // Convert ISO string timestamp to milliseconds
    activatedAt = new Date(dataChannelEntry.createdAt).getTime();
  }

  // Memoize intl messages
  const titleMessage = useMemo(() => intl.formatMessage(intlMessages.title), [currentLocale]);

  // Stable dispatcher reference
  const dispatcherRef = useRef(wordCloudStartStopDispatcher);
  dispatcherRef.current = wordCloudStartStopDispatcher;

  const stableDispatcher = useCallback((data: WordCloudStartStopType) => {
    dispatcherRef.current(data);
  }, []);

  // Store current values in refs for use in content functions
  const isActiveRef = useRef(isActive);
  const currentStartFromNowRef = useRef(currentStartFromNow);
  const activatedAtRef = useRef(activatedAt);
  const intlRef = useRef(intl);
  const pluginApiRef = useRef(pluginApi);

  isActiveRef.current = isActive;
  currentStartFromNowRef.current = currentStartFromNow;
  activatedAtRef.current = activatedAt;
  intlRef.current = intl;
  pluginApiRef.current = pluginApi;

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // STABLE content function for sidekick - created ONCE and stored in ref
  const sidekickContentFunctionRef = useRef<((element: HTMLElement) => ReactDOM.Root) | null>(null);
  if (!sidekickContentFunctionRef.current) {
    sidekickContentFunctionRef.current = (element: HTMLElement) => {
      const root = ReactDOM.createRoot(element);
      sidekickRootRef.current = root;
      root.render(
        <React.StrictMode>
          <Panel
            pluginApi={pluginApiRef.current}
            intl={intlRef.current}
            isActive={isActiveRef.current}
            currentStartFromNow={currentStartFromNowRef.current}
            onStartStop={stableDispatcher}
          />
        </React.StrictMode>,
      );
      return root;
    };
  }

  // STABLE content function for main area - created ONCE and stored in ref
  const mainAreaContentFunctionRef = useRef<((element: HTMLElement) => ReactDOM.Root) | null>(null);
  if (!mainAreaContentFunctionRef.current) {
    mainAreaContentFunctionRef.current = (element: HTMLElement) => {
      mainAreaElementRef.current = element;

      // Start completely hidden for fade-in effect
      element.style.opacity = '0';
      element.style.transition = `opacity ${FADE_DURATION}ms ease-in-out`;

      const root = ReactDOM.createRoot(element);
      mainAreaRootRef.current = root;

      root.render(
        <React.StrictMode>
          <PluginWordCloud
            intl={intlRef.current}
            pluginApi={pluginApiRef.current}
            activatedAt={activatedAtRef.current}
          />
        </React.StrictMode>,
      );

      // Fade in after content is rendered and a small delay
      setTimeout(() => {
        if (isMountedRef.current && element) {
          element.style.opacity = '1';
        }
      }, 50);

      return root;
    };
  }

  // Effect to update sidekick panel content
  useEffect(() => {
    if (sidekickRootRef.current) {
      sidekickRootRef.current.render(
        <React.StrictMode>
          <Panel
            intl={intl}
            pluginApi={pluginApi}
            isActive={isActive}
            currentStartFromNow={currentStartFromNow}
            onStartStop={stableDispatcher}
          />
        </React.StrictMode>,
      );
    }
  }, [isActive, currentStartFromNow, stableDispatcher, intl, pluginApi]);

  // Effect to update main area content
  useEffect(() => {
    if (mainAreaRootRef.current && isActive) {
      mainAreaRootRef.current.render(
        <React.StrictMode>
          <PluginWordCloud
            pluginApi={pluginApi}
            intl={intl}
            activatedAt={activatedAt}
          />
        </React.StrictMode>,
      );
    }
  }, [activatedAt, isActive, intl, pluginApi]);

  // Initial setup - register sidekick only, mainArea will be added on activation
  useEffect(() => {
    const sidekickArea = new GenericContentSidekickArea({
      contentFunction: sidekickContentFunctionRef.current!,
      name: titleMessage,
      open: false,
      buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
      section: 'wordcloud',
    });

    const items: (GenericContentSidekickArea | GenericContentMainArea)[] = [sidekickArea];

    // If already active on mount, also add main area
    if (isActiveRef.current) {
      const mainArea = new GenericContentMainArea({
        contentFunction: mainAreaContentFunctionRef.current!,
      });
      items.push(mainArea);
    }

    const generatedIds = pluginApi.setGenericContentItems(items);
    sidekickContentId.current = generatedIds[0];
    if (isActiveRef.current && generatedIds.length > 1) {
      mainAreaContentId.current = generatedIds[1];
    }

    isInitializedRef.current = true;
    prevIsActiveRef.current = isActiveRef.current;
  }, [titleMessage, pluginApi]);

  // Effect to handle isActive state transitions
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (prevIsActiveRef.current === isActive) return;

    const wasActive = prevIsActiveRef.current;
    prevIsActiveRef.current = isActive;

    // Transition: inactive -> active
    if (!wasActive && isActive) {
      // Fade out presentation area first (via opacity), then add our content
      const sidekickArea = new GenericContentSidekickArea({
        id: sidekickContentId.current,
        contentFunction: sidekickContentFunctionRef.current!,
        name: titleMessage,
        open: false,
        buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
        section: 'wordcloud',
      });
      const mainArea = new GenericContentMainArea({
        ...(mainAreaContentId.current && { id: mainAreaContentId.current }),
        contentFunction: mainAreaContentFunctionRef.current!,
      });

      const newIds = pluginApi.setGenericContentItems([sidekickArea, mainArea]);
      sidekickContentId.current = newIds[0];
      mainAreaContentId.current = newIds[1];
    }

    // Transition: active -> inactive
    if (wasActive && !isActive) {
      // Fade out first, then remove
      if (mainAreaElementRef.current) {
        mainAreaElementRef.current.style.opacity = '0';
      }

      // Wait for fade out, then remove mainArea
      setTimeout(() => {
        if (!isMountedRef.current) return;

        mainAreaRootRef.current = null;
        mainAreaElementRef.current = null;

        const sidekickArea = new GenericContentSidekickArea({
          id: sidekickContentId.current,
          contentFunction: sidekickContentFunctionRef.current!,
          name: titleMessage,
          open: false,
          buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
          section: 'wordcloud',
        });

        const newIds = pluginApi.setGenericContentItems([sidekickArea]);
        sidekickContentId.current = newIds[0];
        mainAreaContentId.current = undefined;
      }, FADE_DURATION);
    }
  }, [isActive, titleMessage, pluginApi]);

  return null;
}

export default WordCloudPlugin;
