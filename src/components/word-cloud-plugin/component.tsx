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
import { WordCloudStartStopType, WordCloudSettingsType } from '../panel/types';

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

  const {
    data: wordCloudSettings,
    pushEntry: wordCloudSettingsDispatcher,
  } = pluginApi.useDataChannel<WordCloudSettingsType>(
    WordCloudChannel.WORDCLOUD,
    DataChannelTypes.LATEST_ITEM,
    WordCloudSubChannels.SETTINGS,
  );

  const { data: currentUser } = pluginApi.useCurrentUser();

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
  const activatedAtRef = useRef<number | undefined>(undefined);
  const prevIsActiveRef = useRef<boolean | undefined>(undefined);
  const isInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Derive isActive from the data channel
  const payloadJson = wordCloudStartStop?.data?.[0]?.payloadJson;
  const isActive = payloadJson?.message === 'start';
  const currentStartFromNow = payloadJson?.startFromNow;

  // Get synced startFromNow setting from settings data channel
  const syncedStartFromNow = wordCloudSettings?.data?.[0]?.payloadJson?.startFromNow;
  
  // Set activatedAt when starting with startFromNow option
  if (isActive && payloadJson?.startFromNow && !activatedAtRef.current) {
    activatedAtRef.current = Date.now();
  } else if (!isActive) {
    activatedAtRef.current = undefined;
  }

  const activatedAt = activatedAtRef.current;

  // Memoize intl messages
  const titleMessage = useMemo(() => intl.formatMessage(intlMessages.title), [currentLocale]);
  // eslint-disable-next-line max-len
  const navBarTitleMessage = useMemo(() => intl.formatMessage(intlMessages.navBarTitle), [currentLocale]);

  // Stable dispatcher reference
  const dispatcherRef = useRef(wordCloudStartStopDispatcher);
  dispatcherRef.current = wordCloudStartStopDispatcher;

  const stableDispatcher = useCallback((data: WordCloudStartStopType) => {
    dispatcherRef.current(data);
  }, []);

  // Stable settings dispatcher reference
  const settingsDispatcherRef = useRef(wordCloudSettingsDispatcher);
  settingsDispatcherRef.current = wordCloudSettingsDispatcher;

  const stableSettingsDispatcher = useCallback((data: WordCloudSettingsType) => {
    settingsDispatcherRef.current(data);
  }, []);

  // Store current values in refs for use in content functions
  const isActiveRef = useRef(isActive);
  const currentStartFromNowRef = useRef(currentStartFromNow);
  const syncedStartFromNowRef = useRef(syncedStartFromNow);
  const activatedAtRefValue = useRef(activatedAt);
  const intlRef = useRef(intl);
  const pluginApiRef = useRef(pluginApi);
  const currentUserRef = useRef(currentUser);

  isActiveRef.current = isActive;
  currentStartFromNowRef.current = currentStartFromNow;
  syncedStartFromNowRef.current = syncedStartFromNow;
  activatedAtRefValue.current = activatedAt;
  intlRef.current = intl;
  pluginApiRef.current = pluginApi;
  currentUserRef.current = currentUser;

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
            intl={intlRef.current}
            isActive={isActiveRef.current}
            currentStartFromNow={currentStartFromNowRef.current}
            syncedStartFromNow={syncedStartFromNowRef.current}
            onStartStop={stableDispatcher}
            onSettingsChange={stableSettingsDispatcher}
            currentUser={currentUserRef.current}
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
      // eslint-disable-next-line no-param-reassign
      element.style.opacity = '0';
      // eslint-disable-next-line no-param-reassign
      element.style.transition = `opacity ${FADE_DURATION}ms ease-in-out`;

      const root = ReactDOM.createRoot(element);
      mainAreaRootRef.current = root;

      root.render(
        <React.StrictMode>
          <PluginWordCloud
            pluginApi={pluginApiRef.current}
            intl={intlRef.current}
            activatedAt={activatedAtRefValue.current}
          />
        </React.StrictMode>,
      );

      // Fade in after content is rendered and a small delay
      setTimeout(() => {
        if (isMountedRef.current && element) {
          // eslint-disable-next-line no-param-reassign
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
            isActive={isActive}
            currentStartFromNow={currentStartFromNow}
            syncedStartFromNow={syncedStartFromNow}
            onStartStop={stableDispatcher}
            onSettingsChange={stableSettingsDispatcher}
            currentUser={currentUser}
          />
        </React.StrictMode>,
      );
    }
  }, [
    isActive,
    currentStartFromNow,
    syncedStartFromNow,
    stableDispatcher,
    stableSettingsDispatcher,
    intl,
    currentUser,
  ]);

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
      section: navBarTitleMessage,
      open: false,
      buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
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
  }, [titleMessage, navBarTitleMessage, pluginApi]);

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
        section: navBarTitleMessage,
        open: false,
        buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
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
          section: navBarTitleMessage,
          open: false,
          buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
        });
        
        const newIds = pluginApi.setGenericContentItems([sidekickArea]);
        sidekickContentId.current = newIds[0];
        mainAreaContentId.current = undefined;
      }, FADE_DURATION);
    }
  }, [isActive, titleMessage, navBarTitleMessage, pluginApi]);

  return null;
}

export default WordCloudPlugin;
