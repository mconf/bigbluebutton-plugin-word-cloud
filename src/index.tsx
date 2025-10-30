import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { BbbPluginSdk, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import PluginWordCloud from './plugin-word-cloud-main-item/component';
import { useInjectIntl } from './hooks/injectIntl';

const uuid = document.currentScript?.getAttribute('uuid') || 'root';

function PluginInitializer({ pluginUuid }:
  { pluginUuid: string }): React.ReactNode {
  BbbPluginSdk.initialize(pluginUuid);
  const pluginApi: PluginApi = BbbPluginSdk.getPluginApi(pluginUuid);
  const IntlInjectedwordCloudPlugin = useInjectIntl(PluginWordCloud, pluginApi);
  return (<IntlInjectedwordCloudPlugin />);
}

const pluginName = document.currentScript?.getAttribute('pluginName') || 'plugin';

const root = ReactDOM.createRoot(document.getElementById(uuid));
root.render(
  <React.StrictMode>
    <PluginInitializer {...{
      pluginUuid: uuid,
      pluginName,
    }}
    />
  </React.StrictMode>,
);
