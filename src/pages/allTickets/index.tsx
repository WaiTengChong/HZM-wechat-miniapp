import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Component } from 'react';
import { GetOrderInfoResponse } from 'src/components/OrderInfoAPI';
import { AtAccordion, AtActivityIndicator, AtCard, AtDivider, AtList } from 'taro-ui';
import logo from '../../../src/image/logo-no.png';
import { getOrderInfo } from '../../api/api';
import { I18n } from '../../I18n';
import './index.scss';

interface OrderDetailItem {
    cost: string;
    runTime: string;
    depatureOriginName: string;
    depatureDestinatName: string;
    onAddress: string;
    offAddress: string;
    ticketCode: string;
    runDate: string;
}

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
                    title: I18n.getOrderInfoFailed,
                    icon: 'none',
                });
                this.setState({ loading: false });
            });
    }

    isSingleOrderDetail = (orderDetailLst: any): orderDetailLst is OrderDetailItem => {
        return !Array.isArray(orderDetailLst) && 
            typeof orderDetailLst === 'object' && 
            'cost' in orderDetailLst &&
            'runTime' in orderDetailLst &&
            'depatureOriginName' in orderDetailLst &&
            'depatureDestinatName' in orderDetailLst &&
            'onAddress' in orderDetailLst &&
            'offAddress' in orderDetailLst &&
            'ticketCode' in orderDetailLst &&
            'runDate' in orderDetailLst;
    }

    handleQRCodeClick = (ticketCode: string) => {
        Taro.previewImage({
            urls: [`https://api.qrserver.com/v1/create-qr-code/?data=${ticketCode}&size=600x600`]
        });
    }

    renderQRCode = (ticketCode: string) => {
        return (
            <View className='qr-section'>
                <View
                    className='qr-code-container'
                    onClick={() => this.handleQRCodeClick(ticketCode)}
                >
                    <Image
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${ticketCode}&size=400x400`}
                        className='qr-code'
                    />
                </View>
                <Text className='qr-code-text'>{ticketCode}</Text>
            </View>
        );
    }

    render() {
        const { loading, orderList, openAccordions } = this.state;

        if (loading) {
            return <AtActivityIndicator mode='center' />;
        }

        if (orderList.length === 0) {
            return (
                <View className='empty-list'>
                    <Text>{I18n.noTicketInfo}</Text>
                </View>
            );
        }

        return (
            <View className='container'>
                <AtDivider content={I18n.myTickets}/>
                {orderList.map((order) => (
                    <AtAccordion
                        className='accordion'
                        key={order.orderNo}
                        open={openAccordions[order.orderNo] || false}
                        onClick={() => this.handleClick(order.orderNo)}
                        title={`${I18n.ticketNumber}: ${order.orderNo} | ${I18n.ticketCost}: $${this.formatPrice(order.orderCost)}`}
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
                                                <Text className='service-hotline-title'>{I18n.customerService}：</Text>
                                                <Text className='service-hotline'>(852)29798778</Text>
                                                <Text className='service-hotline'>(86)4008822322</Text>
                                            </View>
                                        </View>
                                        
                                        <View className='ticket-cost'>
                                            <Text>{I18n.ticketCost}：${this.formatPrice(detail.cost)}</Text>
                                        </View>

                                        <View className='ticket-route'>
                                            <Text className='run-time'>{I18n.departureTime}：{detail.runTime}</Text>
                                            <Text className='route-text'>{detail.depatureOriginName} → {detail.depatureDestinatName}</Text>
                                            <Text className='on-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.departure}：</Text>{'\n'}{detail.onAddress}</Text>
                                            <Text className='off-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.destination}：</Text>{'\n'}{detail.offAddress}</Text>
                                        </View>

                                        <View className='ticket-info'>
                                            <Text>{I18n.ticketNumber}：{detail.ticketCode}</Text>
                                            <Text>{I18n.departureDate}：{detail.runDate}</Text>
                                        </View>

                                        {this.renderQRCode(detail.ticketCode)}

                                        <View className='ticket-footer'>
                                            <Text className='notice-text'>{I18n.ticketNotice1}</Text>
                                            <Text className='notice-text-en'>Please read "NOTICE TO PASSENGERS AND TERMS" on the back of tickets.</Text>
                                        </View>
                                    </AtCard>
                                )) : this.isSingleOrderDetail(order.orderDetailLst) && (
                                    <AtCard
                                        key={`${order.orderNo}-0`}
                                        className='ticket-card'
                                    >
                                        <View className='ticket-header'>
                                            <Image className='company-logo' src={logo} />
                                            <View className='service-hotline-container'>
                                                <Text className='service-hotline-title'>{I18n.customerService}：</Text>
                                                <Text className='service-hotline'>(852)29798778</Text>
                                                <Text className='service-hotline'>(86)4008822322</Text>
                                            </View>
                                        </View>
                                        
                                        <View className='ticket-cost'>
                                            <Text>{I18n.ticketCost}：${this.formatPrice(order.orderDetailLst.cost)}</Text>
                                        </View>

                                        <View className='ticket-route'>
                                            <Text className='run-time'>{I18n.departureTime}：{order.orderDetailLst.runTime}</Text>
                                            <Text className='route-text'>{order.orderDetailLst.depatureOriginName} → {order.orderDetailLst.depatureDestinatName}</Text>
                                            <Text className='on-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.departure}：</Text>{'\n'}{order.orderDetailLst.onAddress}</Text>
                                            <Text className='off-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.destination}：</Text>{'\n'}{order.orderDetailLst.offAddress}</Text>
                                        </View>

                                        <View className='ticket-info'>
                                            <Text>{I18n.ticketNumber}：{order.orderDetailLst.ticketCode}</Text>
                                            <Text>{I18n.departureDate}：{order.orderDetailLst.runDate}</Text>
                                        </View>

                                        {this.renderQRCode(order.orderDetailLst.ticketCode)}

                                        <View className='ticket-footer'>
                                            <Text className='notice-text'>{I18n.ticketNotice1}</Text>
                                            <Text className='notice-text-en'>Please read "NOTICE TO PASSENGERS AND TERMS" on the back of tickets.</Text>
                                        </View>
                                    </AtCard>
                                )
                            }
                        </AtList>
                    </AtAccordion>
                ))}
            </View>
        );
    }
}
