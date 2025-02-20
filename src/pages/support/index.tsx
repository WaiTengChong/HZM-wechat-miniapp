import { Button, Image, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Component } from 'react';
import support from '../../image/support.png';
import './index.scss';

interface State {   
    isConnecting: boolean;
}

export default class Support extends Component<{}, State> {
    state: State = {
        isConnecting: false
    };

    componentDidMount() {
        // 自动打开客服会话
        this.connectCustomerService();
    }

    componentWillUnmount() {
        // 清理状态
        this.setState({ isConnecting: false });
    }

    connectCustomerService = () => {
        this.setState({ isConnecting: true });
        Taro.openCustomerServiceChat({
            extInfo: { url: '' }, // 客服会话页面的路径
            corpId: '', // 企业ID，需要替换为实际的企业ID
            success: () => {
                console.log('成功開啟客服會話');
            },
            fail: (err) => {
                console.error('開啟客服會話失敗:', err);
                this.setState({ isConnecting: false });
            }
        });
    }

    render() {
        const { isConnecting } = this.state;
        
        return (
            <View className='container'>
                <View className='page-body'>
                    <View className='page-section'>
                        <View className='section-title'>
                            線上客服支援
                        </View>
                        <Image src={support} className='support-image' />
                        <Button 
                            className='customer-service-btn'
                            openType='contact'
                            onContact={(e) => {
                                console.log('客服會話事件:', e);
                            }}
                        >
                            {isConnecting ? '正在連接客服...' : '聯繫客服'}
                        </Button>
                        
                        <View className='service-tips'>
                            工作時間：週一至週五 9:00-18:00
                        </View>
                    </View>
                </View>
            </View>
        );
    }
}
