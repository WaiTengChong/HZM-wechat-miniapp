import { Button, Image, Swiper, SwiperItem, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import { Component, PropsWithChildren } from 'react';
import { AtGrid, AtIcon } from 'taro-ui';
import "taro-ui/dist/style/components/button.scss"; // 按需引入
import carLogo from '../../../src/image/carLogo.png';
import logo from '../../../src/image/HZM_Logo.png';
import location from '../../../src/image/location.png';
import { wxLogin } from '../../api/api';
import { I18n } from '../../I18n';
import { RemoteSettingsService } from '../../services/remoteSettings';
import { openPDF } from '../../utils/pdfUtils';
import './index.scss';

type State = {
  current: number;
  loginStatus: boolean;
  nickName: string;
  language: string;
  banner: string[];
};

export default class Index extends Component<PropsWithChildren, State> {
  openPDF = openPDF;
  state: State = {
    current: 0,
    loginStatus: false,
    nickName: '',
    language: 'zh',
    banner: []
  }

  async componentDidMount() {

    setTimeout(() => {
      Taro.hideHomeButton();
    }, 100);

    // Check for app updates
    if (Taro.canIUse('getUpdateManager')) {
      const updateManager = Taro.getUpdateManager();

      updateManager.onCheckForUpdate(function (res) {
        // Callback after checking for new version
        console.log('Has update:', res.hasUpdate);
      });

      updateManager.onUpdateReady(function () {
        Taro.showModal({
          title: I18n.updateTitle,
          content: I18n.updateContent,
          success(res) {
            if (res.confirm) {
              // Apply the new version and restart
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(function () {
        // New version download failed
        Taro.showToast({
          title: I18n.updateFailed,
          icon: 'none'
        });
      });
    }

    await RemoteSettingsService.getInstance().initialize().then(() => {
      this.getBanner();
    });
    this.checkSession();
    this.checkForLanguage();
  }

  componentWillUnmount() { }

  componentDidShow() {
  }

  onShareAppMessage() {
    return {
      title: 'HZM港珠澳汽車快線',
      path: '/pages/index/index'
    }
  }

  getBanner = () => {
    const banner = RemoteSettingsService.getInstance().getList("home_banner", []);
    this.setState({
      banner: banner
    });
  }

  checkForLanguage = () => {
    const language = Taro.getStorageSync("language");
    if (language) {
      this.setState({ language: language });
      I18n.setLanguage(language);
    } else {
      Taro.setStorageSync("language", "zh");
      this.setState({ language: "zh" });
      I18n.setLanguage("zh");
    }
  }

  handleGridItemClick = async (index) => {
    if (index === 0) {
      Taro.navigateTo({ url: '/pages/routes/index' });
    }
    if (index === 1) {
      Taro.navigateTo({ url: '/pages/allTickets/index' });
    }
    if (index === 2) {
      this.openPDF();
    }
    if (index === 3) {
      Taro.navigateTo({ url: '/pages/support/index' });
    }
  }

  getPhoneNumber = async (e: any) => {
    try {
      await wxLogin();
      this.checkSession();
      console.log("wxLogin success");
      this.setState({
        loginStatus: true
      });
    } catch (err) {
      console.log(err, "wxLogin err");
    }
  };

  handleLogout = () => {
    Taro.removeStorageSync("AUTH_TICKET");
    Taro.removeStorageSync("OPEN_ID");
    this.setState({
      loginStatus: false
    })
  }

  checkSession = () => {
    //check AuthToken
    const AUTH_TICKET = Taro.getStorageSync("AUTH_TICKET");
    const OPEN_ID = Taro.getStorageSync("OPEN_ID");
    if (!AUTH_TICKET || !OPEN_ID) {
      this.handleLogout();
    } else {
      this.setState({
        loginStatus: true
      })
    }

    //检测sessionkey
    Taro.checkSession({
      success: () => { },
      fail: () => {
        this.setState({
          loginStatus: false
        })
      }
    });
  }

  toggleLanguage = () => {
    const newLang = this.state.language === 'zh' ? 'hk' : 'zh';
    this.setState({ language: newLang });
    Taro.setStorageSync("language", newLang);
    I18n.setLanguage(newLang);
  }

  render() {
    return (
      <View className='body'>
        <View className='index'>
          <View className='main-content'>
            <View className='logo-container'>
              <Image className='logo' src={logo} mode='aspectFit' />
            </View>
            <Swiper
              className='swiper-container'
              indicatorColor='#999'
              indicatorActiveColor='#333'
              circular
              indicatorDots
              autoplay
            >
              {this.state.banner && this.state.banner.length > 0 && this.state.banner.map((item, index) => (
                <SwiperItem key={index}>
                  <View className='demo-text-1'>
                    <Image src={item} mode='scaleToFill' />
                  </View>
                </SwiperItem>
              ))}
            </Swiper>

            <View className='login-card'>
              <View className='login-card-content'>
                <View className='login-status'>
                  <View className='login-icon'>
                    <AtIcon value='user' size='30' color={this.state.loginStatus ? '#6190E8' : '#999'} />
                  </View>
                  {this.state.loginStatus ? (
                    <> <View className='login-status-icon'>
                      <Text className='logged-in'>{I18n.loggedIn}</Text>
                      <AtIcon className='login-status-icon-check' value='check' size='20' color='#6190E8' />
                    </View>
                      <Text className='user-info'>{ }</Text>
                    </>
                  ) : (
                    <View className='login-wrapper'>
                      <Button
                        className='invisible-button'
                        openType='getPhoneNumber'
                        onGetPhoneNumber={this.getPhoneNumber}
                      />
                      <Text className='user-info-not-logged-in'>{I18n.clickToLogin}</Text>
                      <Text className='logged-in'></Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <AtGrid
              className='grid-container'
              onClick={(item, index) => this.handleGridItemClick(index)}
              hasBorder={true}
              data={[
                {
                  image: carLogo,
                  value: I18n.buyTicket,
                },
                {
                  image: 'https://img.icons8.com/color/48/000000/ticket.png',
                  value: I18n.myTickets
                },
                {
                  image: location,
                  value: I18n.locationInfo
                },
                {
                  image: 'https://img.icons8.com/color/48/000000/info.png',
                  value: I18n.customerService
                }
              ]}
            />
            <View className='language-switch'>
              <Text
                className='language-text'
                onClick={this.toggleLanguage}
              >
                {this.state.language === 'zh' ? '切換至繁體' : '切换至简体'}
              </Text>
            </View>

            {this.state.loginStatus && (
              <View className='logout-container'>
                <Text
                  className='logout-text'
                  onClick={() => this.handleLogout()}
                >
                  {I18n.logout}
                </Text>

              </View>
            )}
            <View className='version-container'>
              <Text className='version-text'>
                0.1.11
              </Text>
            </View>

          </View>
        </View>
      </View>
    )
  }
}
