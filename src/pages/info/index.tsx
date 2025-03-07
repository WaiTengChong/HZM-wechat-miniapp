import { Input, Picker, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import { Component } from 'react';
import { TicketResponse } from 'src/components/getTicketsAPI';
import { ReservationResponse } from 'src/components/reservationsAPI';
import { AtButton, AtCard, AtDivider, AtForm, AtList, AtListItem } from "taro-ui";
import { createOrder, createReservation, getTickets, wxMakePay } from '../../api/api'; // Import the API method
import { I18n } from '../../I18n';
import { RemoteSettingsService } from '../../services/remoteSettings';
import "./index.scss";
interface State {
  ticket: Ticket;
  ticketTypeId: string;
  departureOriginId: string;
  departureDestinationId: string;
  departureRunId: string;
  departureDate: string;
  ticketQuantities: { [ticketId: string]: { [tpaId: string]: { passengers: string; passengerTels: string; ticketTypeId: string, ticketCategoryName: string, ticketCategoryLineId: string }[] } };
  passengerName: string;
  passengerPhone: string;
  firstTicketId: string;
  firstTpaId: string;
  addedTickets: Tpa[];
  routeIdDiscountID: string[];
  routeIdDiscountPrice: string[];
  isDiscount: boolean;
  selectedStartLocationAddress: string;
  selectedEndLocationAddress: string;
  countryCode: string;
  phoneError: boolean;
}

export default class PassengerForm extends Component<{}, State> {
  state: State = {
    ticketTypeId: "",
    departureOriginId: "",
    departureDestinationId: "",
    departureRunId: "",
    departureDate: "",
    ticketQuantities: {},
    ticket: {} as Ticket,
    addedTickets: [],
    routeIdDiscountID: [],
    routeIdDiscountPrice: [],
    isDiscount: false,
    passengerName: "",
    passengerPhone: "",
    firstTicketId: '',
    firstTpaId: '',
    selectedStartLocationAddress: '',
    selectedEndLocationAddress: '',
    countryCode: '86',
    phoneError: false,
  };

  async componentDidMount() {
    const ticket = Taro.getStorageSync('ticket');
    const ticketDate = Taro.getStorageSync('ticket_date');
    const isDiscount = Taro.getStorageSync('isDiscount');
    const ticketQuantities = Taro.getStorageSync('ticketQuantities');
    const addedTickets = Taro.getStorageSync('addedTickets');
    const departureRunId = Taro.getStorageSync('departureRunId');
    const departureOriginId = Taro.getStorageSync('departureOriginId');
    const departureDestinationId = Taro.getStorageSync('departureDestinationId');
    const selectedStartLocationAddress = Taro.getStorageSync('selectedStartLocationAddress');
    const selectedEndLocationAddress = Taro.getStorageSync('selectedEndLocationAddress');

    this.setState({
      ticket: ticket,
      departureDate: ticketDate,
      ticketQuantities: ticketQuantities,
      addedTickets: addedTickets,
      departureRunId: departureRunId,
      departureOriginId: departureOriginId,
      departureDestinationId: departureDestinationId,
      isDiscount: isDiscount,
      selectedStartLocationAddress: selectedStartLocationAddress,
      selectedEndLocationAddress: selectedEndLocationAddress,
    });

    if (!ticket) {
      Taro.redirectTo({
        url: '/pages/index/index'
      });

      Taro.showToast({
        title: I18n.ticketNotFound,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    if (isDiscount) {
      await RemoteSettingsService.getInstance().initialize();
      const routeIdDiscount = RemoteSettingsService.getInstance().getList('routeId_discount', []);
      const routeIdDiscountID = routeIdDiscount.map(item => item.split('/')[0]); // [341, 342]
      const routeIdDiscountPrice = routeIdDiscount.map(item => item.split('/')[1]); // [0.9, 0.9]


      this.setState({
        routeIdDiscountID: routeIdDiscountID,
        routeIdDiscountPrice: routeIdDiscountPrice,
      });

      const setDiscountPrice = routeIdDiscountID.includes(ticket.laRouteId);
      if (setDiscountPrice) {
        this.setState({
          isDiscount: true,
        });

        ticket.tpa.forEach(tpa => {
          tpa.fee = (parseFloat(tpa.fee) * parseFloat(routeIdDiscountPrice[routeIdDiscountID.indexOf(ticket.laRouteId)])).toFixed(0);
        });
      }
    }

    this.setState({
      ticket: ticket,
      departureDate: ticketDate,
    });

    // Determine the first ticket and tpa
    let firstTicketId = '';
    let firstTpaId = '';
    
    // Find the first non-empty ticket group and extract values if available
    for (const tId in ticketQuantities) {
      const tpaEntries = ticketQuantities[tId];
      for (const tpaId in tpaEntries) {
        if (tpaEntries[tpaId] && tpaEntries[tpaId].length > 0) {
          firstTicketId = tId;
          firstTpaId = tpaId;
          
          // Set initial values for passengerName and passengerPhone if available
          const firstPassengerData = tpaEntries[tpaId][0];
          if (firstPassengerData) {
            this.setState({
              passengerName: firstPassengerData.passengers || "",
              passengerPhone: firstPassengerData.passengerTels || ""
            });
          }
          break;
        }
      }
      if (firstTicketId) break;
    }

    this.setState({
      firstTicketId: firstTicketId,
      firstTpaId: firstTpaId
    });
  }

  formatPassengersName = () => {
    const { ticketQuantities } = this.state;
    const result: string[] = [];

    for (const ticketId in ticketQuantities) {
      const tpaEntries = ticketQuantities[ticketId];
      const tpaResults: string[] = [];

      for (const tpaId in tpaEntries) {
        const passengers = tpaEntries[tpaId];
        const passengerNames = passengers.map(p => p.passengers).join(","); // Join passengers for the same tpaId
        tpaResults.push(passengerNames);
      }

      result.push(tpaResults.join(";")); // Join different tpaId results with ";"
    }

    return result.join(","); // Join different ticketId results with ", "
  };
  // Function to format passengers and their telephone numbers
  formatPassengerTel = () => {
    const { ticketQuantities, countryCode } = this.state;
    const result: string[] = [];

    for (const ticketId in ticketQuantities) {
      const tpaEntries = ticketQuantities[ticketId];
      const tpaResults: string[] = [];

      for (const tpaId in tpaEntries) {
        const passengers = tpaEntries[tpaId];
        const passengerNames = passengers.map(p => p.passengers).join(",");
        const passengerTels = passengers.map(p => countryCode + p.passengerTels).join(",");

        tpaResults.push(`${passengerNames}(${passengerTels})`);
      }

      result.push(tpaResults.join(";"));
    }

    return result.join(",");
  };

  getPassengerTel = () => {
    const { ticketQuantities, countryCode } = this.state;
    const telsByTicketType: { [ticketTypeId: string]: string[] } = {};

    // Group phone numbers by ticket type
    for (const ticketId in ticketQuantities) {
      const tpaEntries = ticketQuantities[ticketId];
      for (const tpaId in tpaEntries) {
        const passengers = tpaEntries[tpaId];
        const passengerTels = passengers.map(p => countryCode + p.passengerTels);

        // Initialize array for this ticket type if not exists
        if (!telsByTicketType[passengers[0].ticketTypeId]) {
          telsByTicketType[passengers[0].ticketTypeId] = [];
        }

        // Add phone numbers with country code to the appropriate ticket type group
        telsByTicketType[passengers[0].ticketTypeId].push(...passengerTels);
      }
    }

    // Join phone numbers by ticket type (with commas), then join different types with semicolons
    return Object.values(telsByTicketType)
      .map(tels => tels.join(','))
      .join(';')
      .replace(/\s+/g, '');
  };

  validatePhoneNumber = (phone: string, countryCode: string): boolean => {
    if (!phone) return false;

    switch (countryCode) {
      case '86': // China
        return phone.length === 11;
      case '852': // Hong Kong
        return phone.length === 8;
      case '853': // Macau
        return phone.length === 8;
      default:
        return false;
    }
  };

  handleInputChange = (field: 'name' | 'tel' | 'id', value: string) => {
    // First update the ticketQuantities structure
    const updatedTicketQuantities = { ...this.state.ticketQuantities };

    // Apply the input value to all passengers across all tickets
    Object.keys(updatedTicketQuantities).forEach(tId => {
      Object.keys(updatedTicketQuantities[tId]).forEach(tpId => {
        updatedTicketQuantities[tId][tpId] = updatedTicketQuantities[tId][tpId].map(passenger => ({
          ...passenger,
          [field === 'name' ? 'passengers' : field === 'tel' ? 'passengerTels' : 'passengerIds']: value
        }));
      });
    });

    // Update the ticketQuantities
    this.setState({ ticketQuantities: updatedTicketQuantities });

    // Update the specific field
    if (field === 'name') {
      this.setState({ passengerName: value });
    } else if (field === 'tel') {
      // Check phone validity
      const phoneError = !this.validatePhoneNumber(value, this.state.countryCode);
      this.setState({ 
        passengerPhone: value,
        phoneError: phoneError
      });
    }
  };

  handleCountryCodeChange = (value: string) => {
    const phoneError = !this.validatePhoneNumber(this.state.passengerPhone, value);

    this.setState({
      countryCode: value,
      phoneError: phoneError
    });
  };

  handleSubmit = async () => {
    Taro.showLoading({
      title: I18n.submitting,
      mask: true
    });

    const { departureOriginId, departureDestinationId, departureRunId, departureDate } = this.state;

    if (this.formatPassengersName() === "") {
      Taro.hideLoading();
      Taro.showToast({ title: I18n.passengerInfoEmpty, icon: "none" });
      return;
    };

    try {
      const ticketsByType = this.state.addedTickets.reduce((acc, ticket) => {
        // Only add the ticketCategoryLineId if it's not already in the array
        if (!acc[ticket.ticketTypeId]?.includes(ticket.ticketCategoryLineId)) {
          (acc[ticket.ticketTypeId] = acc[ticket.ticketTypeId] || []).push(ticket.ticketCategoryLineId);
        }
        return acc;
      }, {} as Record<string, string[]>);

      const ticketCategoryLineIds = Object.values(ticketsByType)
        .map(tickets => tickets.join(','))
        .join(',');

      const ticketNumber = Object.values(this.state.ticketQuantities)
        .flatMap(tpaEntries => Object.entries(tpaEntries))
        .reduce((acc, [tpaId, passengers]) => {
          // Group by ticketTypeId
          const ticketTypeId = passengers[0]?.ticketTypeId;
          if (!acc[ticketTypeId]) {
            acc[ticketTypeId] = 0;
          }
          acc[ticketTypeId] += passengers.length;
          return acc;
        }, {} as Record<string, number>);


      const ticketNumberStr = Object.values(ticketNumber).join(',');

      const response: ReservationResponse = await createReservation(
        this.formatPassengersName(),
        this.getPassengerTel(),
        ticketNumberStr,
        ticketCategoryLineIds,
        "1", // currency_id
        departureOriginId,
        departureDestinationId,
        departureRunId,
        departureDate
      );
      const test = true;// remove this when go live
      if (response.errorCode === "SUCCESS") {
        const goods_detail = Array.isArray(response.orderDetailLst)
          ? response.orderDetailLst.map(orderDetail => ({
            goods_id: orderDetail.lineBc,
            goods_name: orderDetail.routeName + ' ' + orderDetail.ticketCode,
            quantity: 1,
            price: parseFloat(orderDetail.cost)
          }))
          : [{
            goods_id: response.orderDetailLst.lineBc,
            goods_name: response.orderDetailLst.routeName + ' ' + response.orderDetailLst.ticketCode,
            quantity: 1,
            price: parseFloat(response.orderDetailLst.cost)
          }];

        const ticketDetail = Array.isArray(response.orderDetailLst)
          ? this.getTicketTypeCount(response.orderDetailLst)
          : response.orderDetailLst.routeName + ' ' + response.orderDetailLst.passangerType + ' x1';

        const wxCreateOrderResponseI = await createOrder(
          response.orderNo,
          this.getTotalPrice(),
          ticketDetail,
          goods_detail
        );
        const wxPayResponse = await wxMakePay(wxCreateOrderResponseI.prepay_id);
        if (wxPayResponse === "SUCCESS") {
          // if (test) {
          const getTicketsResponse: TicketResponse = await getTickets(response.orderNo, response.orderPrice, response.ticketNo);
          if (getTicketsResponse.errorCode === "SUCCESS") {
            // Safely handle orderList regardless of its current type
            let existingOrderList = Taro.getStorageSync("orderList");
            let orderList: string[] = [];

            if (Array.isArray(existingOrderList)) {
              orderList = existingOrderList;
            } else if (existingOrderList) {
              // If it's an object or any other type, convert to array
              orderList = [String(existingOrderList)];
            }

            orderList.push(response.orderNo);
            Taro.setStorageSync("orderList", orderList);
            Taro.setStorageSync("ticket", getTicketsResponse);

            Taro.showToast({ title: I18n.submitSuccess, icon: "success" });
            Taro.navigateTo({
              url: '/pages/order/index'
            });

            Taro.hideLoading();
          }
        } else {
          Taro.hideLoading();
          // Taro.showToast({ title: wxPayResponse, icon: "error" });
        }
      }


      else {
        Taro.hideLoading();
        Taro.showToast({ title: response.errorMsg, icon: "error" })
      }

      //call getTickets 锁票确认
    } catch (error: any) {
      Taro.showToast({ title: I18n.submitFailed, icon: "none" });
      console.error("API Error:", error.message);
    }
  };

  getTotalPrice = (): string => {
    const total = this.state.addedTickets.reduce((sum, tpa) => sum + (parseFloat(tpa.fee) || 0), 0);
    return (Math.round(total * 100)).toString();
  }

  // Add this helper function in the component or outside if appropriate
  getTicketTypeCount(orderDetails: any[]): string {
    const routeName = orderDetails[0].routeName;
    const typeCount: Record<string, number> = {};

    // Count occurrences of each passenger type
    orderDetails.forEach(detail => {
      const type = detail.passangerType;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    // Format the result string
    const typeStrings = Object.entries(typeCount).map(([type, count]) =>
      `${type}x${count}`
    );

    return routeName + ' ' + typeStrings.join(', ');
  }


  render() {
    const { 
      ticketQuantities, 
      ticket, 
      addedTickets, 
      routeIdDiscountPrice, 
      routeIdDiscountID, 
      isDiscount, 
      countryCode, 
      phoneError,
      passengerName,
      passengerPhone
    } = this.state;


    return (
      <View className="container">
        <View className="page-body">

          <AtCard
            key={ticket?.runId}
            title={'車票詳情'}
          >
            <AtList>
              <AtListItem className='location-item' title={I18n.departure} extraText={addedTickets?.[0]?.beginStopName || ''} />
              <AtListItem title={I18n.address} note={this.state.selectedStartLocationAddress} disabled={false} />
              <AtListItem className='location-item' title={I18n.destination} extraText={addedTickets?.[0]?.endStopName || ''} />
              <AtListItem title={I18n.address} note={this.state.selectedEndLocationAddress} disabled={false} />
              <AtListItem title={I18n.departureTime} extraText={ticket?.runStartTime} disabled={false} />

              {
                this.state.isDiscount ? (
                  <>
                    <AtListItem className="original-price" title={I18n.price} extraText={`$${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) / parseFloat(this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(ticket.laRouteId)]) || 0), 0).toFixed(0)}`} disabled={false} />
                    <AtListItem className="discount-display" title={`${this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(ticket.laRouteId)]}${I18n.discount}`} extraText={`${I18n.discountPrice} $${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) || 0), 0).toFixed(0)}`} disabled={false} />
                  </>
                ) : <AtListItem title={I18n.price} extraText={`$${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) || 0), 0).toFixed(0)}`} disabled={false} />
              }

            </AtList>

            {Array.from(new Set(this.state.addedTickets.map(t => t.ticketTypeId))).map((ticketTypeId) => {
              const tpa = this.state.addedTickets.find(t => t.ticketTypeId === ticketTypeId);
              return (
                <AtList key={ticketTypeId}>
                  <AtListItem
                    title={`${tpa!.ticketType}: $${this.state.isDiscount ?
                      (parseFloat(tpa!.fee) / parseFloat(this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(ticket.laRouteId)]) || 0).toFixed(0)
                      :
                      (parseFloat(tpa!.fee) || 0).toFixed(0)}`}
                    extraText={'x' + (ticketQuantities[ticket?.runId]?.[ticketTypeId]?.length || 0)}
                    hasBorder={true}
                    iconInfo={{ size: 20, color: "dark-green", value: "money" }}
                  />
                </AtList>
              );
            })}

          </AtCard>
          
          {/* Always show the form without depending on firstPassenger */}
          <View className="form-container">
            <AtForm>
              <AtDivider content={`${I18n.passengerInfo}`} />
              <Text className="title">{I18n.passengerName}</Text>
              <View className='input-container'>
                <Input
                  name="passengerName"
                  type="text"
                  placeholder={I18n.enterPassengerName}
                  value={passengerName}
                  onInput={(e) => this.handleInputChange('name', e.detail.value)}
                />
              </View>
              <Text className="title">{I18n.passengerPhone}</Text>
              <View className='input-container phone-input-container'>
                <View className='country-code-picker'>
                  <Picker
                    mode='selector'
                    range={['+86', '+852', '+853']}
                    onChange={(e) => {
                      // Extract just the numeric part from the selected value
                      const selectedValue = ['86', '852', '853'][e.detail.value];
                      this.handleCountryCodeChange(selectedValue);
                    }}
                    value={['86', '852', '853'].indexOf(countryCode)}
                  >
                    <View className='country-code'>
                      +{countryCode}
                    </View>
                  </Picker>
                </View>
                <Input
                  className={`phone-input ${phoneError ? 'phone-input-error' : ''}`}
                  name="passengerTel"
                  type="number"
                  placeholder={I18n.enterPassengerPhone}
                  value={passengerPhone}
                  onInput={(e) => {
                    const numericValue = e.detail.value.replace(/[^0-9]/g, '');
                    this.handleInputChange('tel', numericValue);
                  }}
                />
              </View>
              {phoneError && (
                <Text className="error-message">
                  {countryCode === '86'
                    ? '請輸入11位有效電話號碼' // Please enter a valid 11-digit phone number
                    : '請輸入8位有效電話號碼'  // Please enter a valid 8-digit phone number
                  }
                </Text>
              )}
            </AtForm>
          </View>

          <View className='passenger-list'>
            {Object.values(ticketQuantities).flatMap(tpaEntries =>
              Object.values(tpaEntries).flatMap(passengers =>
                passengers
              )
            ).length >= 1 && Object.values(ticketQuantities).flatMap(tpaEntries =>
              Object.values(tpaEntries).flatMap(passengers =>
                passengers
              )
            ).every((passenger) =>
              passenger.passengers && passenger.passengerTels
            ) && !phoneError && (
                <AtButton type="primary" className='submit-button' onClick={this.handleSubmit}>
                  {I18n.submit}
                </AtButton>
              )}
          </View>
        </View>
      </View >
    );
  }
}