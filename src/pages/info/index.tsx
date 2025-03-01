import { Input, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import { Component } from 'react';
import { TicketResponse } from 'src/components/getTicketsAPI';
import { ReservationResponse } from 'src/components/reservationsAPI';
import { AtButton, AtCard, AtDivider, AtForm, AtInputNumber, AtList, AtListItem } from "taro-ui";
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
  addedTickets: Tpa[];
  routeIdDiscountID: string[];
  routeIdDiscountPrice: string[];
  isDiscount: boolean;
  firstPassenger: { passengers: string; passengerTels: string; ticketTypeId: string, ticketCategoryName: string, ticketCategoryLineId: string } | null;
  firstTicketId: string;
  firstTpaId: string;
}

export default class PassengerForm extends Component<{}, State> {
  state: State = {
    ticketTypeId: "",
    departureOriginId: "",
    departureDestinationId: "",
    departureRunId: "",
    departureDate: "",
    ticketQuantities: {}, // Initialize with an empty object
    ticket: {} as Ticket,
    addedTickets: [], // Initialize as empty array
    routeIdDiscountID: [],
    routeIdDiscountPrice: [],
    isDiscount: false,
    firstPassenger: null,
    firstTicketId: '',
    firstTpaId: '',
  };

  async componentDidMount() {
    const ticket = Taro.getStorageSync('ticket');
    const ticketDate = Taro.getStorageSync('ticket_date');

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

    this.setState({
      ticket: ticket,
      departureDate: ticketDate,
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
    const { ticketQuantities } = this.state;
    const result: string[] = [];

    for (const ticketId in ticketQuantities) {
      const tpaEntries = ticketQuantities[ticketId];
      const tpaResults: string[] = [];

      for (const tpaId in tpaEntries) {
        const passengers = tpaEntries[tpaId];
        const passengerNames = passengers.map(p => p.passengers).join(",");
        const passengerTels = passengers.map(p => p.passengerTels).join(",");

        tpaResults.push(`${passengerNames}(${passengerTels})`);
      }

      result.push(tpaResults.join(";"));
    }

    return result.join(",");
  };

  getPassengerTel = () => {
    const { ticketQuantities } = this.state;
    const telsByTicketType: { [ticketTypeId: string]: string[] } = {};

    // Group phone numbers by ticket type
    for (const ticketId in ticketQuantities) {
      const tpaEntries = ticketQuantities[ticketId];
      for (const tpaId in tpaEntries) {
        const passengers = tpaEntries[tpaId];
        const passengerTels = passengers.map(p => p.passengerTels);

        // Initialize array for this ticket type if not exists
        if (!telsByTicketType[passengers[0].ticketTypeId]) {
          telsByTicketType[passengers[0].ticketTypeId] = [];
        }

        // Add phone numbers to the appropriate ticket type group
        telsByTicketType[passengers[0].ticketTypeId].push(...passengerTels);
      }
    }

    // Join phone numbers by ticket type (with commas), then join different types with semicolons
    return Object.values(telsByTicketType)
      .map(tels => tels.join(','))
      .join(';')
      .replace(/\s+/g, '');
  };

  handleInputChange = (field: 'name' | 'tel' | 'id', value: string) => {
    this.setState((prevState) => {
      let firstPassenger: { passengers: string; passengerTels: string; ticketTypeId: string; ticketCategoryName: string; ticketCategoryLineId: string } | null = null;
      const updatedTicketQuantities = { ...prevState.ticketQuantities };

      // Apply the input value to all passengers across all tickets
      Object.keys(updatedTicketQuantities).forEach(tId => {
        Object.keys(updatedTicketQuantities[tId]).forEach(tpId => {
          updatedTicketQuantities[tId][tpId] = updatedTicketQuantities[tId][tpId].map(passenger => ({
            ...passenger,
            [field === 'name' ? 'passengers' : field === 'tel' ? 'passengerTels' : 'passengerIds']: value
          }));

          firstPassenger = updatedTicketQuantities[tId][tpId][0];
        });
      });
      return { ticketQuantities: updatedTicketQuantities, firstPassenger: firstPassenger };
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
        const wxCreateOrderResponseI = await createOrder(response.orderNo, this.getTotalPrice(), response.orderDetailLst.routeName, response.orderDetailLst.ticketCode, response.orderDetailLst.lineBc, response.orderDetailLst.routeName, response.orderDetailLst.ticketTypeId);
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

  handleQuantityChange = (ticketId: string, tpaId: string, value: number) => {
    // Find the ticket info for this specific type
    const ticketInfo = Array.isArray(this.state.ticket?.tpa)
      ? this.state.ticket.tpa.find(tpa => tpa.ticketTypeId === tpaId)
      : this.state.ticket?.tpa && this.state.ticket.tpa.ticketTypeId === tpaId
        ? this.state.ticket.tpa
        : null;

    if (!ticketInfo) return;

    this.setState((prevState) => {
      // Update just this specific ticket type's quantities
      const updatedTicketQuantities = {
        ...prevState.ticketQuantities,
        [ticketId]: {
          ...prevState.ticketQuantities[ticketId] || {},
          [tpaId]: Array(value).fill({
            passengers: prevState.ticketQuantities[ticketId]?.[tpaId]?.[0]?.passengers || '',
            passengerTels: prevState.ticketQuantities[ticketId]?.[tpaId]?.[0]?.passengerTels || '',
            ticketTypeId: tpaId,
            ticketCategoryName: ticketInfo?.spareField4 || '',
            ticketCategoryLineId: ticketInfo?.ticketCategoryLineId || '',
          }),
        },
      };

      // Filter out existing tickets of this type
      const filteredTickets = prevState.addedTickets.filter(t => t.ticketTypeId !== tpaId);

      // Add the updated quantity of this ticket type
      const updatedAddedTickets = value > 0
        ? [...filteredTickets, ...Array(value).fill(ticketInfo)]
        : filteredTickets;

      // Determine the first ticket, tpa, and passenger after the update
      let firstTicketId = '';
      let firstTpaId = '';
      let firstPassenger = null;

      // Find the first non-empty ticket group
      for (const tId in updatedTicketQuantities) {
        const tpaEntries = updatedTicketQuantities[tId];
        for (const tId in tpaEntries) {
          if (tpaEntries[tId] && tpaEntries[tId].length > 0) {
            firstTicketId = tId;
            firstTpaId = tId;
            firstPassenger = tpaEntries[tId][0];
            break;
          }
        }
        if (firstPassenger) break;
      }

      return {
        addedTickets: updatedAddedTickets,
        departureDestinationId: ticketInfo?.endStopId || prevState.departureDestinationId || '1',
        departureOriginId: ticketInfo?.beginStopId || prevState.departureOriginId || '1',
        departureRunId: prevState.ticket?.runId || '',
        ticketQuantities: updatedTicketQuantities,
        firstTicketId,
        firstTpaId,
        firstPassenger,
      };
    });
  };


  render() {
    const { ticketQuantities, ticket, firstPassenger, firstTicketId, firstTpaId } = this.state;


    return (
      <View className="container">
        <View className="page-body">

          <AtCard
            key={ticket?.runId}
            title={ticket?.tpa ? (
              `${Array.isArray(ticket.tpa) ? ticket.tpa[1]?.beginStopName || '' : ticket.tpa?.beginStopName || ''} \n ↓ \n${Array.isArray(ticket.tpa) ? ticket.tpa[1]?.endStopName || '' : ticket.tpa?.endStopName || ''}`
            ) : I18n.loading}
          >
            <AtList>
              <AtListItem title={I18n.departureTime} extraText={ticket?.runStartTime} disabled={false} />

              {
                this.state.isDiscount ? (
                  <>
                    <AtListItem className="original-price" title={I18n.price} extraText={`$${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) / parseFloat(this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(ticket?.laRouteId)]) || 0), 0).toFixed(0)}`} disabled={false} />
                    <AtListItem className="discount-display" title={`${this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(ticket?.laRouteId)].split('.')[1]}${I18n.discount}`} extraText={`${I18n.discountPrice} $${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) || 0), 0).toFixed(0)}`} disabled={false} />
                  </>
                ) : <AtListItem title={I18n.price} extraText={`$${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) || 0), 0).toFixed(0)}`} disabled={false} />
              }

            </AtList>
            {Array.isArray(ticket?.tpa) ? (
              ticket.tpa.map((tpa) => (
                <AtList key={tpa.ticketTypeId}>
                  <AtListItem
                    title={`${tpa.ticketType}: $${this.state.isDiscount ?
                      (parseFloat(tpa.fee) / parseFloat(this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(ticket?.laRouteId)]) || 0).toFixed(0)
                      :
                      (parseFloat(tpa.fee) || 0).toFixed(0)}`}
                    extraText={""}
                    hasBorder={true}
                    iconInfo={{ size: 20, color: "dark-green", value: "money" }}
                  />
                  <View style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <AtInputNumber
                      min={0}
                      max={10}
                      step={1}
                      size='large'
                      value={ticketQuantities[ticket?.runId]?.[tpa.ticketTypeId]?.length || 0}
                      onChange={(value) => {
                        this.handleQuantityChange(ticket?.runId, tpa.ticketTypeId, value);
                      }}
                      type={'number'}
                    />
                  </View>
                </AtList>
              ))
            ) : (ticket?.tpa && !Array.isArray(ticket.tpa)) ? (
              <AtList key={ticket.tpa.ticketTypeId}>

                <AtListItem
                  title={`${ticket.tpa.ticketType}: $${this.state.isDiscount ?
                    (parseFloat(ticket.tpa.fee) / parseFloat(this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(ticket?.laRouteId)]) || 0).toFixed(0)
                    :
                    (parseFloat(ticket.tpa.fee) || 0).toFixed(0)}`}
                  extraText={""}
                  hasBorder={true}
                  iconInfo={{ size: 20, color: "dark-green", value: "money" }}
                />
                <View style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <AtInputNumber
                    min={0}
                    max={10}
                    step={1}
                    size='large'
                    value={ticketQuantities[ticket?.runId]?.[ticket.tpa.ticketTypeId]?.length || 0}
                    onChange={(value) => {
                      if (ticket?.tpa && !Array.isArray(ticket.tpa)) {  // Add type guard here
                        this.handleQuantityChange(ticket?.runId, ticket.tpa.ticketTypeId, value);
                      }
                    }}
                    type={'number'}
                  />
                </View>
              </AtList>
            ) : null}

          </AtCard>
          {firstPassenger && (
            <View className="form-container">
              <AtForm>
                <AtDivider content={`${I18n.passengerInfo}`} />
                <Text className="title">{I18n.passengerName}</Text>
                <View className='input-container'>
                  <Input
                    name="passengerName"
                    type="text"
                    placeholder={I18n.enterPassengerName}
                    value={firstPassenger.passengers || ""}
                    onInput={(e) => this.handleInputChange('name', e.detail.value)}
                  />
                </View>
                <Text className="title">{I18n.passengerPhone}</Text>
                <View className='input-container'>
                  <Input
                    name="passengerTel"
                    type="number"
                    placeholder={I18n.enterPassengerPhone}
                    value={firstPassenger.passengerTels || ""}
                    onInput={(e) => {
                      const numericValue = e.detail.value.replace(/[^0-9]/g, '');
                      this.handleInputChange('tel', numericValue);
                    }}
                  />
                </View>
              </AtForm>
            </View>
          )}

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
            ) && (
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