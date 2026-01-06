import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BbbPluginSdk, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import WordCloudPlugin from './components/word-cloud-plugin/component';
import { useInjectIntl } from './hooks/injectIntl';
import './main.css';

const uuid = document.currentScript?.getAttribute('uuid') || 'root';

function PluginInitializer({ pluginUuid }:
  { pluginUuid: string }): React.ReactNode {
  BbbPluginSdk.initialize(pluginUuid);
  const pluginApi: PluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const IntlInjectedWordCloudPlugin = useInjectIntl(WordCloudPlugin, pluginApi);
  return (<IntlInjectedWordCloudPlugin />);
}

const root = ReactDOM.createRoot(document.getElementById(uuid));
root.render(
  <React.StrictMode>
    <PluginInitializer pluginUuid={uuid} />
  </React.StrictMode>,
);
