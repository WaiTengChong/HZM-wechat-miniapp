import { Icon, Image, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import React from "react";
import { CancelOrderResponse } from 'src/components/cancelOrderAPI';
import { GetTicketInfoResponse } from 'src/components/getTicketInfoAPI';
import { TicketResponse } from 'src/components/getTicketsAPI';
import { GetOrderInfoResponse } from 'src/components/OrderInfoAPI';
import { AtButton, AtCard, AtDivider, AtIcon, AtList } from "taro-ui";
import { cancelOrder, getOrderInfo, getTicketInfo } from '../../api/api'; // Import the API method
import { I18n } from '../../I18n';
import "./index.scss";

// Import assets
import apiLogo from '../../../src/image/apiLogo.png';
import logo from '../../../src/image/logo-no.png';

interface OrderDetailState {
  tickets: {
    orderNo: string;
    cost: string;
    ticketNo: string;
    qrCodeUrl: string;
    depatureDestinatName: string;
    depatureOriginName: string;
    runDate: string;
    runTime: string;
    onAddress?: string;
    offAddress?: string;
  }[];
}

export default class OrderDetail extends React.Component<{}, OrderDetailState> {
  // Update page configuration to disable back button
  config = {
    navigationBarTitleText: '',
    enablePullDownRefresh: false,
    disableScroll: false,
    navigationBarBackButton: false,
    navigationStyle: 'custom'
  }

  state: OrderDetailState = {
    tickets: []
  };

  componentDidMount() {
    const orderDetailLst = Taro.getStorageSync("ticket");
    const apiResponses: TicketResponse[] = Array.isArray(orderDetailLst) ? orderDetailLst : [orderDetailLst];

    console.log("apiResponses", apiResponses);

    if (!apiResponses?.length) {
      Taro.showToast({ title: I18n.noTicketInfo, icon: 'none', duration: 2000 });
      return;
    }

    const tickets = apiResponses.flatMap(response => {
      const orderDetails = Array.isArray(response.orderDetailLst) 
        ? response.orderDetailLst 
        : [response.orderDetailLst];

      return orderDetails.map(detail => ({
        orderNo: response.orderNo,
        cost: detail.cost,
        ticketNo: detail.ticketCode,
        qrCodeUrl: detail.takeTicketCode,
        depatureDestinatName: detail.depatureDestinatName,
        depatureOriginName: detail.depatureOriginName,
        runDate: detail.runDate,
        runTime: detail.runTime,
        onAddress: detail.onAddress,
        offAddress: detail.offAddress,
      }));
    });

    this.setState({ tickets });
  }

  handleCancelOrder = async (orderNo: string) => {
    const response: CancelOrderResponse = await cancelOrder(orderNo);
    if (response.errorCode === "SUCCESS") {
      Taro.showToast({ title: I18n.orderCancelled, icon: "success", duration: 2000 });
      // Remove the cancelled ticket from state
      this.setState(prevState => ({
        tickets: prevState.tickets.filter(ticket => ticket.orderNo !== orderNo)
      }));
    } else {
      Taro.showToast({ title: response.errorMsg || I18n.cancelOrderFailed, icon: 'none', duration: 2000 });
    }
  };

  handleOrderInfo = async (orderNo: string) => {
    const response: GetOrderInfoResponse = await getOrderInfo(orderNo);
    if (response.errorCode === "SUCCESS") {
      Taro.showToast({ title: I18n.getOrderInfoSuccess, icon: "success", duration: 2000 });
    } else {
      Taro.showToast({ title: response.errorMsg || I18n.getOrderInfoFailed, icon: 'none', duration: 2000 });
    }
  };

  handleGetTicketInfo = async (ticketNo: string) => {
    const response: GetTicketInfoResponse = await getTicketInfo(ticketNo);
    if (response.ticketApplayStock.ETicketNO !== null || response.ticketApplayStock.ETicketNO !== undefined) {
      Taro.showToast({ title: I18n.getTicketInfoSuccess, icon: "success", duration: 2000 });
    } else {
      Taro.showToast({ title: I18n.getTicketInfoFailed, icon: 'none', duration: 2000 });
    }
  };

  formatPrice = (price: string): string => {
    return parseFloat(price).toFixed(2);
  };


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

  // Override the componentDidShow lifecycle method to handle back button
  componentDidShow() {
    // Add a custom event listener for back button press
    Taro.eventCenter.on('navigateBack', () => {
      // Prevent default back behavior and navigate to index instead
      Taro.redirectTo({ url: '/pages/index/index' });
    });
  }
  
  componentWillUnmount() {
    // Clean up event listener
    Taro.eventCenter.off('navigateBack');
  }

  render() {
    const { tickets } = this.state;
    return (
      <View className="order-detail-container">
        {tickets.map((ticket, index) => (
          <View key={`ticket-${index}`}>
            <View className='order-success-container'>
              <Text className='order-success-text'>{I18n.orderSuccess}</Text>
              <AtIcon value='check-circle' size='70' color='#008000' />
            </View>
            <AtCard
              title={`${I18n.orderNumber}: ${ticket.orderNo}`}
              key={`${ticket.orderNo}-${index}`}
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
                <Text>{I18n.orderCost}：${this.formatPrice(ticket.cost)}</Text>
              </View>

              <View className='ticket-route'>
                <Text className='run-time'>{I18n.departureDate}：{ticket.runDate}</Text>
                <Text className='run-time'>{I18n.departureTime}：{ticket.runTime}</Text>
                <Text className='route-text'>{ticket.depatureOriginName} → {ticket.depatureDestinatName}</Text>
                {ticket.onAddress && (
                  <Text className='on-board-text'>
                    <Text style={{ fontWeight: 'bold' }}>{I18n.departure}：</Text>{'\n'}{ticket.onAddress}
                  </Text>
                )}
                {ticket.offAddress && (
                  <Text className='off-board-text'>
                    <Text style={{ fontWeight: 'bold' }}>{I18n.destination}：</Text>{'\n'}{ticket.offAddress}
                  </Text>
                )}
              </View>

              <View className='ticket-info'>
                <Text>{I18n.ticketNumber}：{ticket.ticketNo}</Text>
              </View>

              {this.renderQRCode(ticket.qrCodeUrl)}
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
          </View>
        ))}
        <AtButton
          type="primary"
          className="back-button"
          onClick={() => Taro.navigateTo({ url: "/pages/index/index" })}
        >
          {I18n.back}
        </AtButton>
      </View>
    );
  }
}
