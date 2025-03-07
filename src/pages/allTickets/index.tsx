import { Image, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Component } from 'react';
import { GetOrderInfoResponse } from 'src/components/OrderInfoAPI';
import { AtAccordion, AtActivityIndicator, AtCard, AtDivider, AtList } from 'taro-ui';
import apiLogo from '../../../src/image/apiLogo.png';
import logo from '../../../src/image/logo-no.png';
import { getOrderInfo, getOrderList } from '../../api/api';
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
    orderList: { [key: string]: GetOrderInfoResponse };
    loading: boolean;
    loadingOrders: { [key: string]: boolean };
    openAccordions: { [key: string]: boolean };
}

export default class TicketListPage extends Component<{}, State> {
    state: State = {
        orderNoList: [],
        orderList: {},
        loading: true,
        loadingOrders: {},
        openAccordions: {},
    };

    handleClick = async (orderNo: string) => {
        const { orderList, openAccordions, loadingOrders } = this.state;
        
        // Toggle accordion state
        const newOpenState = !openAccordions[orderNo];
        this.setState(prevState => ({
            openAccordions: {
                ...prevState.openAccordions,
                [orderNo]: newOpenState
            }
        }));

        // If opening and order details not loaded yet, fetch them
        if (newOpenState && !orderList[orderNo]) {
            this.setState(prevState => ({
                loadingOrders: {
                    ...prevState.loadingOrders,
                    [orderNo]: true
                }
            }));

            try {
                const orderInfo = await getOrderInfo(orderNo);
                this.setState(prevState => ({
                    orderList: {
                        ...prevState.orderList,
                        [orderNo]: orderInfo
                    },
                    loadingOrders: {
                        ...prevState.loadingOrders,
                        [orderNo]: false
                    }
                }));
            } catch (error) {
                console.error(`Error fetching order ${orderNo}:`, error);
                Taro.showToast({
                    title: I18n.getOrderInfoFailed,
                    icon: 'none',
                });
                this.setState(prevState => ({
                    loadingOrders: {
                        ...prevState.loadingOrders,
                        [orderNo]: false
                    }
                }));
            }
        }
    }

    formatPrice(price: string): string {
        const formattedPrice = parseFloat(price).toFixed(2);
        return formattedPrice.endsWith('.00') ? parseFloat(price).toFixed(0) : formattedPrice;
    }

    componentDidMount = async () => {
        try {
            const orderNoList = await getOrderList();
            this.setState({
                orderNoList: orderNoList,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching order list:', error);
            Taro.showToast({
                title: I18n.getOrderInfoFailed,
                icon: 'none',
            });
            this.setState({ loading: false });
        }
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
        const { loading, orderNoList, orderList, openAccordions, loadingOrders } = this.state;

        if (loading) {
            return <AtActivityIndicator mode='center' />;
        }

        if (orderNoList.length === 0) {
            return (
                <View className='empty-list'>
                    <Text>{I18n.noTicketInfo}</Text>
                </View>
            );
        }

        return (
            <View className='container'>
                <AtDivider content={I18n.myTickets}/>
                {orderNoList.map((orderNo) => {
                    const order = orderList[orderNo];
                    const isLoading = loadingOrders[orderNo];
                    const isOpen = openAccordions[orderNo] || false;

                    return (
                        <AtAccordion
                            isAnimation={false}
                            className='accordion'
                            key={orderNo}
                            open={isOpen}
                            onClick={() => this.handleClick(orderNo)}
                            title={`${I18n.orderNumber}: ${orderNo}${order ? ` | ${I18n.orderCost}: $${this.formatPrice(order.orderCost)}` : ''}`}
                        >
                            {isLoading ? (
                                <View className='loading-container'>
                                    <AtActivityIndicator mode='center' />
                                </View>
                            ) : order && (
                                <AtList>
                                    {Array.isArray(order.orderDetailLst) ? 
                                        order.orderDetailLst.map((detail, index) => (
                                            <AtCard
                                                key={`${orderNo}-${index}`}
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
                                                    <Text>{I18n.orderCost}：${this.formatPrice(detail.cost)}</Text>
                                                </View>

                                                <View className='ticket-route'>
                                                    <Text className='run-time'>{I18n.departureDate}：{detail.runDate}</Text>
                                                    <Text className='run-time'>{I18n.departureTime}：{detail.runTime}</Text>
                                                    <Text className='route-text'>{detail.depatureOriginName} → {detail.depatureDestinatName}</Text>
                                                    <Text className='on-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.departure}：</Text>{'\n'}{detail.onAddress}</Text>
                                                    <Text className='off-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.destination}：</Text>{'\n'}{detail.offAddress}</Text>
                                                </View>

                                                <View className='ticket-info'>
                                                    <Text>{I18n.ticketNumber}：{detail.ticketCode}</Text>
                                                </View>

                                                {this.renderQRCode(detail.ticketCode)}
                                                <View className='apiLogo-container'>
                                                    <Image className='apiLogo' src={apiLogo} />
                                                    <Text className='early-arrival'>{I18n.earlyArrival}</Text>
                                                </View>
                                                
                                                    <View className='ticket-footer'>
                                                        <AtDivider content={I18n.luggagePolicy} />

                                                        <View className='page-info'>
                                                            <AtList hasBorder={false}>{I18n.luggageWelcome}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy1}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy2}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy3}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy4}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy5}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy6}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageSizeA}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageSizeB}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageSizeC}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy7}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageCheckTime}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy8}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy9}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy10}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy11}</AtList>
                                                        </View>
                                                    </View>
                                            </AtCard>
                                        )) : this.isSingleOrderDetail(order.orderDetailLst) && (
                                            <AtCard
                                                key={`${orderNo}-0`}
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
                                                    <Text>{I18n.orderCost}：${this.formatPrice(order.orderDetailLst.cost)}</Text>
                                                </View>

                                                <View className='ticket-route'>
                                                    <Text className='run-time'>{I18n.departureTime}：{order.orderDetailLst.runTime}</Text>
                                                    <Text className='run-time'>{I18n.departureDate}：{order.orderDetailLst.runDate}</Text>
                                                    <Text className='route-text'>{order.orderDetailLst.depatureOriginName} → {order.orderDetailLst.depatureDestinatName}</Text>
                                                    <Text className='on-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.departure}：</Text>{'\n'}{order.orderDetailLst.onAddress}</Text>
                                                    <Text className='off-board-text'><Text style={{fontWeight: 'bold'}}>{I18n.destination}：</Text>{'\n'}{order.orderDetailLst.offAddress}</Text>
                                                </View>

                                                <View className='ticket-info'>
                                                    <Text>{I18n.ticketNumber}：{order.orderDetailLst.ticketCode}</Text>
                                                </View>

                                                    {this.renderQRCode(order.orderDetailLst.ticketCode)}
                                                    <View className='apiLogo-container'>
                                                        <Image className='apiLogo' src={apiLogo} />
                                                        <Text className='early-arrival'>{I18n.earlyArrival}</Text>
                                                    </View>
                                                <View className='ticket-footer'>
                                                        <AtDivider content={I18n.luggagePolicy} />

                                                        <View className='page-info'>
                                                            <AtList hasBorder={false}>{I18n.luggageWelcome}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy1}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy2}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy3}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy4}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy5}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy6}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageSizeA}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageSizeB}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageSizeC}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy7}</AtList>
                                                            <AtList hasBorder={false} className='luggage-padding'>{I18n.luggageCheckTime}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy8}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy9}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy10}</AtList>
                                                            <AtList hasBorder={false}>{I18n.luggagePolicy11}</AtList>
                                                        </View>
                                                </View>
                                            </AtCard>
                                        )
                                    }
                                </AtList>
                            )}
                        </AtAccordion>
                    );
                })}
            </View>
        );
    }
}
