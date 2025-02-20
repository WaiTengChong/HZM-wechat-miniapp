import { Image, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import React from "react";
import { CancelOrderResponse } from 'src/components/cancelOrderAPI';
import { GetTicketInfoResponse } from 'src/components/getTicketInfoAPI';
import { TicketResponse } from 'src/components/getTicketsAPI';
import { GetOrderInfoResponse } from 'src/components/OrderInfoAPI';
import { AtButton, AtCard, AtDivider, AtListItem } from "taro-ui";
import { cancelOrder, getOrderInfo, getTicketInfo } from '../../api/api'; // Import the API method
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
  state: OrderDetailState = {
    tickets: []
  };

  componentDidMount() {
    const orderDetailLst = Taro.getStorageSync("ticket");
    const apiResponses: TicketResponse[] = Array.isArray(orderDetailLst) ? orderDetailLst : [orderDetailLst];

    console.log("apiResponses", apiResponses);

    if (!apiResponses?.length) {
      Taro.showToast({ title: "未找到票務信息", icon: 'none', duration: 2000 });
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
      Taro.showToast({ title: "訂單已取消", icon: "success", duration: 2000 });
      // Remove the cancelled ticket from state
      this.setState(prevState => ({
        tickets: prevState.tickets.filter(ticket => ticket.orderNo !== orderNo)
      }));
    } else {
      Taro.showToast({ title: response.errorMsg || "取消訂單失敗", icon: 'none', duration: 2000 });
    }
  };

  handleOrderInfo = async (orderNo: string) => {
    const response: GetOrderInfoResponse = await getOrderInfo(orderNo);
    if (response.errorCode === "SUCCESS") {
      Taro.showToast({ title: "獲取訂單信息成功", icon: "success", duration: 2000 });
    } else {
      Taro.showToast({ title: response.errorMsg || "獲取訂單信息失敗", icon: 'none', duration: 2000 });
    }
  };

  handleGetTicketInfo = async (ticketNo: string) => {
    const response: GetTicketInfoResponse = await getTicketInfo(ticketNo);
    if (response.ticketApplayStock.ETicketNO !== null || response.ticketApplayStock.ETicketNO !== undefined) {
      Taro.showToast({ title: "獲取票號信息成功", icon: "success", duration: 2000 });
    } else {
      Taro.showToast({ title: "獲取票號信息失敗", icon: 'none', duration: 2000 });
    }
  };

  render() {
    const { tickets } = this.state;
    return (
      <View className="order-detail-container">
        {tickets.map((ticket, index) => (
          <AtCard 
            key={ticket.orderNo + index}
            title="訂單詳情" 
            extra={ticket.orderNo} 
            className="order-card"
          >
            <View className="depature-info">
              <Text className="depature-text">
                {ticket.depatureDestinatName} → {ticket.depatureOriginName}
              </Text>
            </View>
            <AtDivider content="二維碼" />
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
            <AtDivider content="車票信息" />
            <View className="order-info">
              <AtListItem title="票號" extraText={ticket.ticketNo} />
              <AtListItem title="車票價格" hasBorder={false} extraText={`$${parseFloat(ticket.cost).toFixed(2).replace(/\.?0+$/, '')}`} />
              <AtListItem title="出發日期" hasBorder={false} extraText={ticket.runDate} />
              <AtListItem title="出發時間" hasBorder={false} extraText={ticket.runTime} />
            </View>
            <AtButton
              type="secondary"
              className="cancel-button"
              onClick={() => this.handleGetTicketInfo(ticket.ticketNo)}
            >
              查看票號
            </AtButton>
            <AtButton
              type="secondary"
              className="cancel-button"
              onClick={() => this.handleOrderInfo(ticket.orderNo)}
            >
              查看訂單
            </AtButton>
          </AtCard>
        ))}
        <AtButton
          type="primary"
          className="back-button"
          onClick={() => Taro.navigateTo({ url: "/pages/index/index" })}
        >
          返回
        </AtButton>
      </View>
    );
  }
}
