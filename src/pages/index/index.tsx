import { Button, Image, Swiper, SwiperItem, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import { Component, PropsWithChildren } from 'react';
import { AtGrid, AtIcon } from 'taro-ui';
import "taro-ui/dist/style/components/button.scss"; // 按需引入
import { wxLogin } from '../../api/api';
import { I18n } from '../../I18n';
import { RemoteSettingsService } from '../../services/remoteSettings';

import logo from '../../../src/image/logo-no.png';
import './index.scss';

type State = {
  current: number;
  loginStatus: boolean;
  nickName: string;
  language: string;
  banner: string[];
};

export default class Index extends Component<PropsWithChildren, State> {

  state: State = {
    current: 0,
    loginStatus: false,
    nickName: '',
    language: 'zh',
    banner:[]
  }

  async componentDidMount() {
    await RemoteSettingsService.getInstance().initialize();
    this.checkSession();
    this.getBanner();
  }

  componentWillUnmount() { }

  componentDidShow() {
  }

  componentDidHide() { }

  getBanner = () => {
    const banner =  RemoteSettingsService.getInstance().getList("home_banner", []);
    this.setState({
      banner: banner
    });
  }

  handleGridItemClick = async (index) => {
    if (index === 0) {
      Taro.navigateTo({ url: '/pages/routes/index' });
    }
    if (index === 1) {
      Taro.navigateTo({ url: '/pages/allTickets/index' });
    }
    if (index === 2) {
      Taro.navigateTo({ url: '/pages/support/index' });
    }
    // if (index === 2) {
    //   //string loading
    //   Taro.showLoading({
    //     title: '加载中',
    //   });
    //   const payId = await createOrder("123", "City Express Bus Ticket", "1234567890");
    //   console.log("payId", payId);
    //   const id = payId.prepay_id;
    //   console.log("id", id);
    //   //end loading
    //   Taro.hideLoading();
    //   wxMakePay(id);
    // }
    if (index === 4) {
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
      Taro.showToast({
        title: I18n.pleaseLoginFirst,
        icon: 'error',
        duration: 2000
      });
      return;
    }

    //检测sessionkey
    Taro.checkSession({
      success: () => {
        this.setState({
          loginStatus: true
        })

        Taro.getUserInfo({
          success: (res) => {
            this.setState({
              nickName: res.userInfo.nickName
            })
          },
          fail: (err) => {
            console.log(err, "getUserInfo err");
            Taro.showToast({
              title: I18n.getUserInfoFailed,
              icon: 'error',
              duration: 2000
            })
          }
        })
      },
      fail: () => {
        this.setState({
          loginStatus: false
        })
        Taro.showToast({
          title: I18n.sessionExpired,
          icon: 'error',
          duration: 2000
        })
        // session_key 已经失效，需要重新执行登录流程
        // 登录
        wxLogin();
      }
    });
  }

  toggleLanguage = () => {
    const newLang = this.state.language === 'zh' ? 'hk' : 'zh';
    this.setState({ language: newLang });
    I18n.setLanguage(newLang);
  }

  render() {
    return (
      <View className='body'>
        <View className='index'>
          <View className='main-content'>
            <View className='logo-container'>
              <Image className='logo' src={logo} />
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
                      <Text className='user-info'>{}</Text>
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
                  image: 'https://img.icons8.com/color/48/000000/train-ticket.png',
                  value: I18n.buyTicket,
                },
                {
                  image: 'https://img.icons8.com/color/48/000000/ticket.png',
                  value: I18n.myTickets
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
                  onClick={this.handleLogout}
                >
                  {I18n.logout}
                </Text>
              </View>
            )}

          </View>
        </View>
      </View>
    )
  }
}
