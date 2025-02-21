import { Component, PropsWithChildren } from 'react';
import './app.scss';
import { RemoteSettingsService } from './services/remoteSettings';

class App extends Component<PropsWithChildren>  {

  async componentDidMount () {
    try {
      await RemoteSettingsService.getInstance().initialize();
    } catch (error) {
      console.error('Failed to initialize remote settings:', error);
    }
  }

  componentDidShow () {}

  componentDidHide () {}

  // this.props.children 是将要会渲染的页面
  render () {
    return this.props.children
  }
}

export default App
