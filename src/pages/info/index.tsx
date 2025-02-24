import { Input, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import { Component } from 'react';
import { TicketResponse } from 'src/components/getTicketsAPI';
import { ReservationResponse } from 'src/components/reservationsAPI';
import { AtButton, AtCard, AtDivider, AtForm, AtInputNumber, AtList, AtListItem } from "taro-ui";
import { createOrder, createReservation, getTickets, wxMakePay } from '../../api/api'; // Import the API method
import { I18n } from '../../I18n';
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
  };

  componentDidMount() {
    const ticket = Taro.getStorageSync('ticket');
    const ticketDate = Taro.getStorageSync('ticket_date');

    if (!ticket) {
      Taro.redirectTo({
        url: '/pages/index/index'
      });
      return;
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

  handleInputChange = (index: number, ticketId: string, tpaId: string, field: 'name' | 'tel' | 'id', value: string) => {
    this.setState((prevState) => {
      const updatedTicketQuantities = { ...prevState.ticketQuantities };

      // Apply the input value to all passengers across all tickets
      Object.keys(updatedTicketQuantities).forEach(tId => {
        Object.keys(updatedTicketQuantities[tId]).forEach(tpId => {
          updatedTicketQuantities[tId][tpId] = updatedTicketQuantities[tId][tpId].map(passenger => ({
            ...passenger,
            [field === 'name' ? 'passengers' : field === 'tel' ? 'passengerTels' : 'passengerIds']: value
          }));
        });
      });

      return { ticketQuantities: updatedTicketQuantities };
    });
  };

  handleDeletePassenger = (index: number) => {
    const { ticketQuantities } = this.state;
    const updatedTicketQuantities = { ...ticketQuantities };

    for (const ticketId in updatedTicketQuantities) {
      const tpaEntries = updatedTicketQuantities[ticketId];
      for (const tpaId in tpaEntries) {
        const passengers = tpaEntries[tpaId];
        const updatedPassengers = passengers.filter((_, i) => i !== index);
        const updatedTels = updatedPassengers.map(p => p.passengerTels);

        updatedTicketQuantities[ticketId][tpaId] = updatedPassengers;
      }
    }

    this.setState({ ticketQuantities: updatedTicketQuantities });
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
        const wxCreateOrderResponseI = await createOrder(response.orderNo, response.orderDetailLst.routeName, response.orderDetailLst.ticketCode, response.orderDetailLst.lineBc, response.orderDetailLst.routeName, response.orderDetailLst.ticketTypeId);
        const wxPayResponse = await wxMakePay(wxCreateOrderResponseI.prepay_id);
        if(wxPayResponse === "SUCCESS"){
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

  handleQuantityChange = (ticketId: string, tpaId: string, value: number) => {
    // Get the tickets for this specific type
    console.log("Array.isArray(this.state.ticket?.tpa)", Array.isArray(this.state.ticket?.tpa));

    const addedTickets = Array.isArray(this.state.ticket?.tpa)
      ? this.state.ticket.tpa.filter(tpa => tpa.ticketTypeId === tpaId)
      : this.state.ticket?.tpa && this.state.ticket.tpa.ticketTypeId === tpaId
        ? [this.state.ticket.tpa]
        : [];

    this.setState((prevState) => {
      // Remove existing tickets of this type
      const existingTickets = prevState.addedTickets.filter(t => t.ticketTypeId !== tpaId);

      // Add new tickets if value > 0
      const updatedAddedTickets = value > 0
        ? [...existingTickets, ...Array(value).fill(addedTickets[0])]
        : existingTickets;

      const updatedTicketQuantities = {
        ...prevState.ticketQuantities,
        [ticketId]: {
          ...prevState.ticketQuantities[ticketId],
          [tpaId]: Array(value).fill({
            passengers: '',
            passengerTels: '',
            passengerIds: '',
            ticketTypeId: tpaId,
            ticketCategoryName: addedTickets[0]?.spareField4 || '',
          }),
        },
      };

      return {
        addedTickets: updatedAddedTickets,
        departureDestinationId: updatedAddedTickets[0]?.endStopId || '1',
        departureOriginId: updatedAddedTickets[0]?.beginStopId || '1',
        departureRunId: prevState.ticket?.runId || '',
        ticketQuantities: updatedTicketQuantities
      };
    });
  };
  // Add this method to handle state and ticket retrieval
  private getPassengerData() {
    const {
      ticketQuantities,
      ticket,
    } = this.state;
    return { ticketQuantities, ticket };
  }

  render() {
    const { ticketQuantities, ticket } = this.getPassengerData();

    // Get the first ticket and passenger for the form
    const firstTicketId = Object.keys(ticketQuantities)[0];
    const firstTpaId = firstTicketId ? Object.keys(ticketQuantities[firstTicketId])[0] : null;
    const firstPassenger = firstTicketId && firstTpaId ? ticketQuantities[firstTicketId][firstTpaId][0] : null;

    return (
      <View className="container">
        <View className="page-body">

          <AtCard
            key={ticket?.runId}
            title={ticket?.tpa ? (
              `${Array.isArray(ticket.tpa) ? ticket.tpa[1]?.beginStopName || '' : ticket.tpa?.beginStopName || ''} → ${Array.isArray(ticket.tpa) ? ticket.tpa[1]?.endStopName || '' : ticket.tpa?.endStopName || ''}`
            ) : I18n.loading}
          >
            <AtList>
              <AtListItem title={I18n.departureTime} extraText={ticket?.runStartTime} disabled={false} />
              <AtListItem title={I18n.price} extraText={`$${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) || 0), 0).toFixed(0)}`} disabled={false} />
            </AtList>
            {Array.isArray(ticket?.tpa) ? (
              ticket.tpa.map((tpa) => (
                <AtList key={tpa.ticketTypeId}>
                  <AtListItem
                    title={`${tpa.ticketType}: $${tpa.fee}`}
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
                        console.log("ticketQuantities[ticket?.runId]?.[tpa.ticketTypeId]", ticketQuantities[ticket?.runId]?.[tpa.ticketTypeId]);
                        this.handleQuantityChange(ticket?.runId, tpa.ticketTypeId, value);
                        if (value < (ticketQuantities[ticket?.runId]?.[tpa.ticketTypeId]?.length || 0)) {
                          const quantityDifference = (ticketQuantities[ticket?.runId]?.[tpa.ticketTypeId]?.length || 0) - value;
                          for (let i = 0; i < quantityDifference; i++) {
                            // Handle passenger removal logic here if needed
                          }
                        }
                      }}
                      type={'number'}
                    />
                  </View>
                </AtList>
              ))
            ) : (ticket?.tpa && !Array.isArray(ticket.tpa)) ? (
              <AtList key={ticket.tpa.ticketTypeId}>
                <AtListItem
                  title={`${ticket.tpa.ticketType}: $${ticket.tpa.fee}`}
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
                        console.log("ticketQuantities[ticket?.runId]?.[ticket.tpa.ticketTypeId]",
                          ticketQuantities[ticket?.runId]?.[ticket.tpa.ticketTypeId]);

                        this.handleQuantityChange(ticket?.runId, ticket.tpa.ticketTypeId, value);

                        if (value < (ticketQuantities[ticket?.runId]?.[ticket.tpa.ticketTypeId]?.length || 0)) {
                          const quantityDifference = (
                            ticketQuantities[ticket?.runId]?.[ticket.tpa.ticketTypeId]?.length || 0
                          ) - value;
                          for (let i = 0; i < quantityDifference; i++) {
                            // Handle passenger removal logic here if needed
                          }
                        }
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
                <AtDivider content={`${I18n.passengerInfo} ${firstPassenger.ticketCategoryName}`} />
                <Text className="title">{I18n.passengerName}</Text>
                <View className='input-container'>
                  <Input
                    name="passengerName"
                    type="text"
                    placeholder={I18n.enterPassengerName}
                    value={firstPassenger.passengers || ""}
                    onInput={(e) => this.handleInputChange(0, firstTicketId, firstTpaId!, 'name', e.detail.value)}
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
                      this.handleInputChange(0, firstTicketId, firstTpaId!, 'tel', numericValue);
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