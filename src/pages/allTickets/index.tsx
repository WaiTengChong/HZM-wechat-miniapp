import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Component } from 'react';
import { GetOrderInfoResponse } from 'src/components/OrderInfoAPI';
import { AtAccordion, AtActivityIndicator, AtCard, AtDivider, AtList, AtListItem } from 'taro-ui';
import logo from '../../../src/image/logo-no.png';
import { getOrderInfo } from '../../api/api';
import './index.scss';

interface State {
    orderNoList: string[];
    orderList: GetOrderInfoResponse[];
    loading: boolean;
    openAccordions: { [key: string]: boolean };
}

export default class TicketListPage extends Component<{}, State> {
    state: State = {
        orderNoList: [],
        orderList: [],
        loading: true,
        openAccordions: {},
    };

    handleClick = (orderNo: string) => {
        this.setState(prevState => ({
            openAccordions: {
                ...prevState.openAccordions,
                [orderNo]: !prevState.openAccordions[orderNo]
            }
        }));
    }

    formatPrice(price: string): string {
        const formattedPrice = parseFloat(price).toFixed(2);
        return formattedPrice.endsWith('.00') ? parseFloat(price).toFixed(0) : formattedPrice;
    }

    componentDidMount() {
        const orderNoList = Taro.getStorageSync('orderList') || [];
        this.setState({orderNoList:orderNoList});
        if (orderNoList.length === 0) {
            this.setState({ loading: false });
        } else {
            this.setState({ orderNoList }, async () => {
                this.fetchOrderList();
            });
        }
    }

    fetchOrderList = () => {
        Promise.all(this.state.orderNoList.map(async orderNo => {
            try {
                return await getOrderInfo(orderNo);
            } catch (error) {
                console.error(`Error fetching order ${orderNo}:`, error);
                return null;
            }
        }))
            .then((orderData) => {
                const validOrders = orderData.filter((order): order is GetOrderInfoResponse => order !== null);
                this.setState({ orderList: validOrders, loading: false });
            })
            .catch(() => {
                Taro.showToast({
                    title: 'Error fetching order list',
                    icon: 'none',
                });
                this.setState({ loading: false });
            });
    }

    render() {
        const { loading, orderList, openAccordions } = this.state;

        if (loading) {
            return <AtActivityIndicator mode='center' />;
        }

        if (orderList.length === 0) {
            return (
                <View className='empty-list'>
                    <Text>列表為空</Text>
                </View>
            );
        }

        return (
            <View className='container'>
                <AtDivider content='訂單列表'/>
                {orderList.map((order) => (
                    <AtAccordion
                        className='accordion'
                        key={order.orderNo}
                        open={openAccordions[order.orderNo] || true}//TODO UPDATE TO FALSE
                        onClick={() => this.handleClick(order.orderNo)}
                        title={`訂單號: ${order.orderNo} | 總價: $${this.formatPrice(order.orderCost)}`}
                    >
                        <AtList>
                            {Array.isArray(order.orderDetailLst) ? 
                                order.orderDetailLst.map((detail, index) => (
                                    <AtCard
                                        key={`${order.orderNo}-${index}`}
                                        className='ticket-card'
                                    >
                                        <View className='ticket-header'>
                                            <Image className='company-logo' src={logo} />
                                            <View className='service-hotline-container'>
                                                <Text className='service-hotline-title'>服務熱線：</Text>
                                                <Text className='service-hotline'>(852)29798778</Text>
                                                <Text className='service-hotline'>(86)4008822322</Text>
                                            </View>
                                        </View>
                                        
                                        <View className='ticket-cost'>
                                            <Text>票價：${this.formatPrice(detail.cost)}</Text>
                                        </View>

                                        <View className='ticket-route'>
                                            <Text className='run-time'>開車時間：{detail.runTime}</Text>
                                            <Text className='route-text'>{detail.depatureOriginName} → {detail.depatureDestinatName}</Text>
                                            <Text className='on-board-text'><Text style={{fontWeight: 'bold'}}>上車地點：</Text>{'\n'}{detail.onAddress}</Text>
                                            <Text className='off-board-text'><Text style={{fontWeight: 'bold'}}>下車地點：</Text>{'\n'}{detail.offAddress}</Text>
                                        </View>

                                        <View className='ticket-info'>
                                            <Text>票號：{detail.ticketCode}</Text>
                                            <Text>日期(日/月/年)：{detail.runDate}</Text>
                                        </View>

                                        <View className='qr-section'>
                                            <View
                                                className='qr-code-container'
                                                onClick={() => Taro.previewImage({
                                                    urls: [`https://api.qrserver.com/v1/create-qr-code/?data=${detail.ticketCode}&size=600x600`]
                                                })}
                                            >
                                                <Image
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${detail.ticketCode}&size=400x400`}
                                                    className='qr-code'
                                                />
                                            </View>

                                            <Text className='qr-code-text'>{detail.ticketCode}</Text>
                                        </View>

                                        <View className='ticket-footer'>
                                            <Text className='notice-text'>請細閱後頁的"客運服務條款"</Text>
                                            <Text className='notice-text-en'>Please read "NOTICE TO PASSENGERS AND TERMS" on the back of tickets.</Text>
                                        </View>
                                    </AtCard>
                                )) : 
                                <AtCard
                                    key={order.orderNo}
                                    title={`票號: ${order.orderDetailLst.ticketCode}`}
                                    extra={<AtListItem title='票價' note={this.formatPrice(order.orderDetailLst.cost)} hasBorder={false} />}
                                    note={`下單時間: ${order.orderDetailLst.runDate}`}
                                >
                                    <AtList>
                                        <AtListItem title='發車時間' note={order.orderDetailLst.runTime} hasBorder={false} />
                                        <AtListItem title='路線' note={`${order.orderDetailLst.depatureOriginName} → ${order.orderDetailLst.depatureDestinatName}`} hasBorder={false} />
                                        <AtListItem title='狀態' note={order.orderDetailLst.statusName} hasBorder={false} />
                                        <AtListItem title='座位' note={order.orderDetailLst.seats} hasBorder={false} />
                                        <AtDivider content='二維碼' />
                                        <View
                                            className='qr-code-container'
                                            onClick={() => Taro.previewImage({
                                                urls: [`https://api.qrserver.com/v1/create-qr-code/?data=${order.orderDetailLst.ticketCode}&size=400x400`]
                                            })}
                                        >
                                            <Image
                                                src={`https://api.qrserver.com/v1/create-qr-code/?data=${order.orderDetailLst.ticketCode}&size=400x400`}
                                                className='qr-code'
                                            />
                                        </View>
                                    </AtList>
                                </AtCard>
                            }
                        </AtList
                    </AtAccordion>
                ))}
            </View>
        );
    }
}
