import { Image, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import React from "react";
import { CancelOrderResponse } from 'src/components/cancelOrderAPI';
import { GetTicketInfoResponse } from 'src/components/getTicketInfoAPI';
import { TicketResponse } from 'src/components/getTicketsAPI';
import { GetOrderInfoResponse } from 'src/components/OrderInfoAPI';
import { AtButton, AtCard, AtDivider, AtListItem } from "taro-ui";
import { cancelOrder, getOrderInfo, getTicketInfo } from '../../api/api'; // Import the API method
import { I18n } from '../../I18n';
import "./index.scss";


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
  }[];
}

export default class OrderDetail extends React.Component<{}, OrderDetailState> {
  // Add page configuration
  config = {
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

  render() {
    const { tickets } = this.state;
    return (
      <View className="order-detail-container">
        {tickets.map((ticket, index) => (
          <AtCard 
            key={ticket.orderNo + index}
            title={I18n.orderDetail}
            extra={ticket.orderNo} 
            className="order-card"
          >
            <View className="depature-info">
              <Text className="depature-text">
                {ticket.depatureDestinatName} → {ticket.depatureOriginName}
              </Text>
            </View>
            <AtDivider content={I18n.qrCode} />
            <View 
              className="qr-code-container" 
              onClick={() => Taro.previewImage({ 
                urls: [`https://api.qrserver.com/v1/create-qr-code/?data=${ticket.qrCodeUrl}&size=600x600`] 
              })}
            >
              <Image 
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${ticket.qrCodeUrl}&size=600x600`} 
                className="qr-code" 
              />
            </View>
            <AtDivider content={I18n.ticketInfo} />
            <View className="order-info">
              <AtListItem title={I18n.ticketNumber} extraText={ticket.ticketNo} />
              <AtListItem title={I18n.ticketPrice} hasBorder={false} extraText={`$${parseFloat(ticket.cost).toFixed(2).replace(/\.?0+$/, '')}`} />
              <AtListItem title={I18n.departureDate} hasBorder={false} extraText={ticket.runDate} />
              <AtListItem title={I18n.departureTime} hasBorder={false} extraText={ticket.runTime} />
            </View>
            {/* <AtButton
              type="secondary"
              className="cancel-button"
              onClick={() => this.handleGetTicketInfo(ticket.ticketNo)}
            >
              {I18n.viewTicket}
            </AtButton>
            <AtButton
              type="secondary"
              className="cancel-button"
              onClick={() => this.handleOrderInfo(ticket.orderNo)}
            >
              {I18n.viewOrder}
            </AtButton> */}
          </AtCard>
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
