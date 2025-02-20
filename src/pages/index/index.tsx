import { Image, Swiper, SwiperItem, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import { Component, PropsWithChildren } from 'react';
import { AtGrid, AtIcon } from 'taro-ui';
import "taro-ui/dist/style/components/button.scss"; // 按需引入
import { wxLogin } from '../../api/api';

import logo from '../../../src/image/logo-no.png';
import image1 from '../../../static/banner/carBanner1.png';
import image2 from '../../../static/banner/carBanner2.png';
import './index.scss';

type State = {
  current: number;
  loginStatus: boolean;
  nickName: string;
};

export default class Index extends Component<PropsWithChildren, State> {

  state: State = {
    current: 0,
    loginStatus: false,
    nickName: ''
  }

  componentDidMount() {
    this.checkSession();
  }

  componentWillUnmount() { }

  componentDidShow() {
  }

  componentDidHide() { }

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
        title: '请先登录',
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
        Taro.getUserProfile({
          desc: '获取用户信息',
          success: (res) => {
            console.log(res, "getUserProfile success");
            this.setState({
              nickName: res.userInfo.nickName
            })
          },
          fail: (err) => {
            console.log(err, "getUserProfile err");
          }
        })

        Taro.getUserInfo({
          success: (res) => {
            console.log(res, "getUserInfo success");
            this.setState({
              nickName: res.userInfo.nickName
            })
          },
          fail: (err) => {
            console.log(err, "getUserInfo err");
            Taro.showToast({
              title: '获取用户信息失败',
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
          title: '已经失效',
          icon: 'error',
          duration: 2000
        })
        // session_key 已经失效，需要重新执行登录流程
        // 登录
        wxLogin();
      }
    });
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
              <SwiperItem>
                <View className='demo-text-1'>
                  <Image src={image1} />
                </View>
              </SwiperItem>
              <SwiperItem>
                <View className='demo-text-2'>
                  <Image src={image2} />
                </View>
              </SwiperItem>
            </Swiper>

            <View className='login-card' onClick={!this.state.loginStatus ? this.getPhoneNumber : undefined}>
              <View className='login-card-content'>

                <View className='login-status'>
                  <View className='login-icon'>
                    <AtIcon value='user' size='30' color={this.state.loginStatus ? '#6190E8' : '#999'} />
                  </View>
                  {this.state.loginStatus ? (
                    <>
                      <Text className='user-info'>{this.state.nickName}</Text>
                      <View className='login-status-icon'>
                        <Text className='logged-in'>已登入</Text>
                        <AtIcon className='login-status-icon-check' value='check' size='20' color='#6190E8' />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text className='user-info-not-logged-in'>請點擊登入</Text>
                      <Text className='logged-in'></Text>
                    </>
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
                  value: '購買車票',
                },
                {
                  image: 'https://img.icons8.com/color/48/000000/ticket.png',
                  value: '我的車票'
                },
                {
                  image: 'https://img.icons8.com/color/48/000000/info.png',
                  value: '客服中心'
                }
              ]}
            />
            {this.state.loginStatus && (
              <View className='logout-container'>
                <Text
                  className='logout-text'
                  onClick={this.handleLogout}
                >
                  登出
                </Text>
              </View>
            )}

          </View>
        </View>
      </View>
    )
  }
}
