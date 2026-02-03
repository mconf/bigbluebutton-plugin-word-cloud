import * as React from 'react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { ClientSettings } from '../types';

const SETTINGS_NAME = 'WordCloudPlugin';

type SettingsContextType = {
  panelImageUrl: string | null;
};

const SettingsContext = createContext<SettingsContextType | null>(null);

type SettingsProviderProps = {
  children: React.ReactNode;
};

declare global {
  interface Window {
    meetingClientSettings?: ClientSettings;
  }
}

function SettingsProvider(props: SettingsProviderProps) {
  const { children } = props;
  const [panelImageUrl, setPanelImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const plugins = window.meetingClientSettings?.public?.plugins;
    const wcPlg = plugins?.find((plugin) => plugin.name === SETTINGS_NAME);

    if (wcPlg?.settings && wcPlg.settings.panelImageUrl) {
      setPanelImageUrl(wcPlg.settings.panelImageUrl);
    } else {
      pluginLogger.warn('[Word Cloud Plugin] No panel image URL found in plugin settings');
    }
  }, []);

  const contextValue = useMemo(() => ({
    panelImageUrl,
  }), [panelImageUrl]);

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

function usePanelImageUrl() {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('usePanelImageUrl must be used within a SettingsProvider');
  }

  return context.panelImageUrl;
}

export { SettingsProvider, usePanelImageUrl };
