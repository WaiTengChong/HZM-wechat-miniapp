import { Picker, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import dayjs from 'dayjs';
import { Component } from 'react';
import { AtActivityIndicator, AtButton, AtCalendar, AtCard, AtCheckbox, AtDivider, AtGrid, AtIcon, AtInputNumber, AtList, AtListItem, AtSteps } from 'taro-ui';
import "taro-ui/dist/style/components/button.scss"; // 按需引入
import "taro-ui/dist/style/components/card.scss"; // 按需引入
import { fetchRoutesAPILocal, getDeparturesZL, getLocationByRoute, isTestMode } from "../../api/api";
import { I18n } from '../../I18n';
import { RemoteSettingsService } from '../../services/remoteSettings';
import { openPDF } from '../../utils/pdfUtils';
import './index.scss';

export default class Routes extends Component<{}, State> {

  openPDF = openPDF;

  // Initialize state
  state: State = {
    route: [],
    location: [],
    selectorChecked: '',
    selectorIndex: 0,
    selectedRouteId: '',
    dateSel: '',
    loading: true, // Set loading to true initially
    startLocation: '',
    endLocation: '',
    stepCurrent: 0,
    startLocations: [],
    endLocations: [],
    selectedStartLocation: '',
    selectedEndLocation: '',
    selectedStartLocationAddress: '',
    selectedEndLocationAddress: '',
    selectedStartLocationLatitude: '',
    selectedStartLocationLongitude: '',
    selectedEndLocationLatitude: '',
    selectedEndLocationLongitude: '',
    selectedStartLocationIndex: 0,
    selectedEndLocationIndex: 0,
    selectedStartArea: '',
    selectedEndArea: '',
    startAreaList: [],
    endAreaList: [],
    ticketData: [],
    selectedTicketIndex: 0,
    selectedTicket: {} as Ticket,
    routeTimeLoading: false,
    checkboxOption: [{
      value: 'agree',
      label: I18n.checkBoxText,
      desc: '',
    }],
    isCheckBoxClicked: false,
    isCheckboxHighlighted: false,
    isTicketHighlighted: false,
    ticketQuantities: {},
    addedTickets: [],
    routeIdDiscountID: [],
    routeIdDiscountPrice: [],
    isDiscount: false,
    departureOriginId: '',
    departureDestinationId: '',
    showTicketInfo: false,
  };

  // Fetch data from the API when the component mounts
  async componentDidMount() {
    try {
      // Initialize RemoteSettings if not already initialized
      await RemoteSettingsService.getInstance().initialize();
      const response = await fetchRoutesAPILocal();
      if (response.route && Array.isArray(response.route)) {
        const filteredRoute = RemoteSettingsService.getInstance().getList('routeId_allowed', []);
        // Simplified route filtering logic
        const filteredRoutes = filteredRoute.length > 0
          ? response.route.filter(route => filteredRoute.includes(route.routeId))
          : response.route;

        const routesToUse = isTestMode ? response.route : filteredRoutes;

        this.setState({
          route: routesToUse,
          startAreaList: [...new Set(routesToUse.map(route => route.fromCityCName))].filter(Boolean) as string[],
          endAreaList: [...new Set(routesToUse.map(route => route.toCityCName))].filter(Boolean) as string[],
          loading: false,
        });

      } else {
        console.error('Invalid response:', response.message);
        this.setState({ loading: false });
        Taro.navigateBack();
      }
    } catch (error) {
      console.error('Error in componentDidMount:', error);
      this.setState({ loading: false });
      Taro.showToast({
        title: '加載設置失敗',
        icon: 'none',
        duration: 2000
      });
    }
  }

  setLoading(loading: boolean) {
    this.setState({ loading });
  }

  checkDiscount = async (ticket: Ticket) => {
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

      if (Array.isArray(ticket.tpa)) {
        ticket.tpa.forEach(tpa => {
          tpa.fee = (parseFloat(tpa.fee) * parseFloat(routeIdDiscountPrice[routeIdDiscountID.indexOf(ticket.laRouteId)])).toFixed(0);
        });
      } else if (ticket.tpa) {
        ticket.tpa.fee = (parseFloat(ticket.tpa.fee) * parseFloat(routeIdDiscountPrice[routeIdDiscountID.indexOf(ticket.laRouteId)])).toFixed(0);
      }
    }
    this.setState({
      selectedTicket: ticket,
    });
  }

  loadRouteTime = async (date: string, isFirst: boolean = false) => {
    this.setState({ routeTimeLoading: true });
    this.setState({
      selectedTicket: {} as Ticket,
      addedTickets: [],
      ticketQuantities: {},
      selectedTicketIndex: 0,
    });
    if (date != '') {
      try {
        Taro.showLoading({ title: '加載中...' });
        const response: DepartureZL = await getDeparturesZL(
          this.state.selectedRouteId,
          this.state.location.find(lc => lc.cname === this.state.selectedStartLocation)?.id!,
          this.state.location.find(lc => lc.cname === this.state.selectedEndLocation)?.id!,
          0,
          "",
          date
        );
        if (response.run != undefined) {
          // Convert to array if it's a single Ticket object
          const ticketsArray = Array.isArray(response.run) ? response.run : [response.run];

          if (ticketsArray.length > 0) {
            //if the date is today, only show the ticket that is after the current time
            if (date === dayjs().format('YYYY-MM-DD')) {
              this.setState({
                ticketData: ticketsArray.filter(ticket => dayjs(`${date} ${ticket.runTime}`).isAfter(dayjs().add(1, 'hour')))
              });
            } else {
              this.setState({
                ticketData: ticketsArray,
              });
            }

            Taro.setStorageSync("ticket_date", this.state.dateSel);
          } else {
            this.setState({ ticketData: [], showTicketInfo: false });
            if (!isFirst) {
              Taro.showToast({ title: '没有可用的车票', icon: 'none' })
            }
          }
        } else {
          this.setState({ ticketData: [], showTicketInfo: false });
          if (!isFirst) {
            Taro.showToast({ title: '没有可用的车票', icon: 'none' })
          }
        }
      } catch (error) {
        console.error('Error fetching route time:', error);
      } finally {
        Taro.hideLoading();
        this.setState({ routeTimeLoading: false });
      }
    }
  }

  // Handle changes in the selector dropdown
  onChangeSelectedRoute = async () => {
    if (this.state.selectedStartArea === '' || this.state.selectedEndArea === '') {
      return;
    }

    const selectedIndex = this.state.route.findIndex(route => route.fromCityCName === this.state.selectedStartArea && route.toCityCName === this.state.selectedEndArea);
    const selectedRouteId = this.state.route[selectedIndex].routeId;

    this.setState({
      selectorChecked: this.state.route[selectedIndex].routeCName,
      selectorIndex: selectedIndex,
      selectedRouteId: selectedRouteId,
      stepCurrent: 1,
      selectedStartArea: this.state.route[selectedIndex].fromCityCName,
      selectedEndArea: this.state.route[selectedIndex].toCityCName,

    });

    try {
      this.setLoading(true);
      const response = await getLocationByRoute(selectedRouteId);
      this.setState({
        location: response.locations,
        startLocations: response.locations.filter(lc => lc.on === "true"),
        endLocations: response.locations.filter(lc => lc.on === "false"),

        //for auto select the first location
        selectedStartLocation: response.locations.filter(lc => lc.on === "true")[0].cname,
        selectedEndLocation: response.locations.filter(lc => lc.on === "false")[0].cname,
        selectedStartLocationAddress: response.locations.filter(lc => lc.on === "true")[0].address,
        selectedEndLocationAddress: response.locations.filter(lc => lc.on === "false")[0].address,
        selectedStartLocationLatitude: response.locations.filter(lc => lc.on === "true")[0].lat,
        selectedStartLocationLongitude: response.locations.filter(lc => lc.on === "true")[0].lon,
        selectedEndLocationLatitude: response.locations.filter(lc => lc.on === "false")[0].depature_lat,
        selectedEndLocationLongitude: response.locations.filter(lc => lc.on === "false")[0].destination_long,
        selectedStartLocationIndex: 0,
        selectedEndLocationIndex: 0,
      });

      Taro.setStorageSync('onLat', response.locations.filter(lc => lc.on === "true")[0].lat);
      Taro.setStorageSync('onLong', response.locations.filter(lc => lc.on === "true")[0].lon);
      Taro.setStorageSync('offLat', response.locations.filter(lc => lc.on === "false")[0].depature_lat);
      Taro.setStorageSync('offLong', response.locations.filter(lc => lc.on === "false")[0].destination_long);
      //await this.loadRouteTime(this.state.dateSel,true);
      this.setLoading(false);
    } catch (error) {
      this.setLoading(false);
      console.error('Error fetching locations:', error);
    }
  };

  handleStartAreaClick = (index: number) => {
    this.setState({
      selectedStartArea: this.state.startAreaList[index],
      endAreaList: this.state.route.filter(route =>
        route.fromCityCName === this.state.startAreaList[index]
      ).map(route => route.toCityCName)
    }, this.onChangeSelectedRoute);
  };

  handleEndAreaClick = (index: number) => {
    this.setState({
      selectedEndArea: this.state.endAreaList[index],
      startAreaList: this.state.route.filter(route =>
        route.toCityCName === this.state.endAreaList[index]
      ).map(route => route.fromCityCName)
    }, this.onChangeSelectedRoute);
  };

  resetSelected = () => {
    console.log('resetSelected');
    this.setState({
      addedTickets: [],
      ticketQuantities: {},
      selectedTicketIndex: 0,
      selectedTicket: {} as Ticket,
      ticketData: [],
      showTicketInfo: false,
      isCheckBoxClicked: false,
    });
  }

  handleReset = () => {
    this.setState({
      selectedStartArea: '',
      selectedEndArea: '',
      startAreaList: [...new Set(this.state.route.map(route => route.fromCityCName))].filter(Boolean) as string[],
      endAreaList: [...new Set(this.state.route.map(route => route.toCityCName))].filter(Boolean) as string[],

    })
  }
  handleCheckBoxChange = (selectedList: string[]) => {
    this.setState({
      isCheckBoxClicked: selectedList.includes('agree')
    });
  }

  onStepChange = async (stepCurrent: number) => {
    // If at step 0, prevent moving forward
    if (this.state.stepCurrent === 0) {
      return;
    }

    // If at step 1, only allow going back to step 0
    if (this.state.stepCurrent === 1) {
      if (stepCurrent === 0) {
        this.setState({ stepCurrent: 0 });
      }
      return;
    }

    // If at step 2, allow going back to any previous step
    if (this.state.stepCurrent === 2) {
      if (stepCurrent < 2) {
        this.setState({ stepCurrent });
      }
    }
  }

  onStartLoaciontChange = (e: any) => {
    this.resetSelected();
    this.setState({
      selectedStartLocationIndex: e.detail.value,
      selectedStartLocation: this.state.startLocations[e.detail.value].cname,
      selectedStartLocationAddress: this.state.startLocations[e.detail.value].address,
      selectedStartLocationLatitude: this.state.startLocations[e.detail.value].lat,
      selectedStartLocationLongitude: this.state.startLocations[e.detail.value].lon
    }, async () => {
      await this.loadRouteTime(this.state.dateSel);
      Taro.setStorageSync('onLat', this.state.startLocations[e.detail.value].lat);
      Taro.setStorageSync('onLong', this.state.startLocations[e.detail.value].lon);
    });
  }

  onEndLoaciontChange = (e: any) => {
    this.resetSelected();
    this.setState({
      selectedEndLocationIndex: e.detail.value,
      selectedEndLocation: this.state.endLocations[e.detail.value].cname,
      selectedEndLocationAddress: this.state.endLocations[e.detail.value].address,
      selectedEndLocationLatitude: this.state.endLocations[e.detail.value].depature_lat,
      selectedEndLocationLongitude: this.state.endLocations[e.detail.value].destination_long
    }, async () => {
      await this.loadRouteTime(this.state.dateSel);
      Taro.setStorageSync('offLat', this.state.endLocations[e.detail.value].depature_lat);
      Taro.setStorageSync('offLong', this.state.endLocations[e.detail.value].destination_long);
    })
  }

  // Handle date changes
  onDateChange = async (e: any) => {
    this.setState({
      dateSel: e.value, // Use e.date for date input
      selectedTicketIndex: 0,
      selectedTicket: {} as Ticket,
    });
    await this.loadRouteTime(e.value);
  };

  onTicketChange = async (e: any) => {
    this.setState({
      selectedTicket: {} as Ticket,
      addedTickets: [],
      ticketQuantities: {},
      selectedTicketIndex: 0,
    });
    const index = parseInt(e.detail.value);
    const selectedTicket = this.state.ticketData![index];
    await this.setState({
      selectedTicket,
      selectedTicketIndex: index
    });
    await this.checkDiscount(selectedTicket);
    this.setState({
      showTicketInfo: true,
    });
  };

  handleConfirmSelection = () => {
    const { selectedTicket, isCheckBoxClicked } = this.state;
    if (!selectedTicket || this.state.addedTickets.length === 0) {
      // Set the ticket items to highlighted
      this.setState({ isTicketHighlighted: true });

      // Show the toast
      Taro.showToast({
        title: I18n.pleaseSelectTicket,
        icon: 'none',
        duration: 2000
      });

      // Scroll to the ticket section
      setTimeout(() => {
        Taro.createSelectorQuery()
          .select('.at-checkbox')
          .boundingClientRect()
          .exec((res) => {
            if (Array.isArray(res) && res[0]) {
              Taro.pageScrollTo({
                scrollTop: res[0].bottom,
                duration: 300
              });
            }
          });
      }, 100);

      // Reset highlight after 3 seconds
      setTimeout(() => {
        this.setState({ isTicketHighlighted: false });
      }, 3000);

      return;
    }

    if (!isCheckBoxClicked) {
      // Set the checkbox to highlighted
      this.setState({ isCheckboxHighlighted: true });

      // Show the toast
      Taro.showToast({
        title: I18n.pleaseAgreeToTerms,
        icon: 'none',
        duration: 2000
      });

      // Reset highlight after 3 seconds
      setTimeout(() => {
        this.setState({ isCheckboxHighlighted: false });
      }, 3000);

      return;
    }

    Taro.setStorageSync('ticket', selectedTicket);
    Taro.setStorageSync('isDiscount', this.state.isDiscount);
    Taro.setStorageSync('ticketQuantities', this.state.ticketQuantities);
    Taro.setStorageSync('addedTickets', this.state.addedTickets);
    Taro.setStorageSync('departureRunId', this.state.selectedTicket?.runId);
    Taro.setStorageSync('departureOriginId', this.state.departureOriginId);
    Taro.setStorageSync('departureDestinationId', this.state.departureDestinationId);
    Taro.setStorageSync('selectedStartLocationAddress', this.state.selectedStartLocationAddress);
    Taro.setStorageSync('selectedEndLocationAddress', this.state.selectedEndLocationAddress);
    Taro.navigateTo({
      url: `/pages/info/index`
    });
  };

  handleQuantityChange = (ticketId: string, tpaId: string, value: number, seatNum: string) => {
    // Find the ticket info for this specific type
    var availableSeatNum = parseInt(seatNum);

    const ticketInfo = Array.isArray(this.state.selectedTicket?.tpa)
      ? this.state.selectedTicket.tpa.find(tpa => tpa.ticketTypeId === tpaId)
      : this.state.selectedTicket?.tpa && this.state.selectedTicket.tpa.ticketTypeId === tpaId
        ? this.state.selectedTicket.tpa
        : null;

    if (!ticketInfo) return;

    this.setState((prevState) => {
      // Filter out existing tickets of this type
      const filteredTickets = prevState.addedTickets.filter(t => t.ticketTypeId !== tpaId);

      // Calculate the total number of tickets after this change
      const totalTicketsAfterChange = filteredTickets.length + value;

      // Check if the total number of tickets exceeds the available seats
      if (totalTicketsAfterChange > availableSeatNum) {
        // Show toast message
        Taro.showToast({
          title: I18n.noMoreSeatsAvailable,
          icon: 'none',
          duration: 2000
        });

        // Return the current state without changes
        return prevState;
      }

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
        ...prevState,
        addedTickets: updatedAddedTickets,
        departureDestinationId: ticketInfo?.endStopId || prevState.departureDestinationId,
        departureOriginId: ticketInfo?.beginStopId || prevState.departureOriginId,
        departureRunId: prevState.selectedTicket?.runId || '',
        ticketQuantities: updatedTicketQuantities,
        firstTicketId,
        firstTpaId,
        firstPassenger,
      };
    });
  };

  openMap = (latitude: string, longitude: string, address: string, name: string) => {
    Taro.openLocation({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      name: name,
      address: address,
    });

  }

  // Render the component
  render() {
    const { route: dateSel, showTicketInfo, checkboxOption, isCheckBoxClicked, location, selectedStartLocationIndex, selectedEndLocationIndex, ticketData, selectedTicketIndex, selectedTicket, ticketQuantities } = this.state;
    const items = [
      { 'title': I18n.route, 'desc': I18n.routeDesc },
      { 'title': I18n.location, 'desc': I18n.locationDesc },
      { 'title': I18n.schedule, 'desc': I18n.scheduleDesc }
    ]

    return (
      <View className='container'>
        <View className='page-body'>
          <View className='banner'>
            <Text className='banner-title'>{I18n.sevenSeatCar}</Text>
          </View>
          <AtSteps
            items={items}
            current={this.state.stepCurrent}
            onChange={this.onStepChange.bind(this)}
          />

          {this.state.loading && (
            <View className='loading-container'>
              <AtActivityIndicator mode='center' />
            </View>
          )}

          {/* Route Selector */}
          {this.state.stepCurrent === 0 && !this.state.loading && (
            <View className='page-section'>
              <View>
                <View className='step-one-container'>
                  <Text className='sub-title'>{I18n.departure}</Text>
                  <Text className='sub-title-area'>{this.state.selectedStartArea}</Text>
                  {(this.state.selectedStartArea !== '' || this.state.selectedEndArea !== '') && (
                    <AtButton className='reset-button' type='primary'
                      onClick={() => !this.state.loading && this.handleReset()}
                      disabled={this.state.loading}
                      loading={this.state.loading}
                    >{I18n.reset}</AtButton>
                  )}
                </View>
                {this.state.selectedStartArea === "" && (
                    <AtGrid
                      hasBorder={false}
                      columnNum={3}
                      data={this.state.startAreaList.map(area => ({
                        value: area.includes('（') ? area.replace('（', '\n(').replace('）', ')') : area,
                      }))}
                      onClick={(item, index) => this.handleStartAreaClick(index)}
                    />
                )}

                <View style={{ height: '20px' }}></View>

                <View className='step-one-container'>
                  <Text className='sub-title'>{I18n.destination}</Text>
                  <Text className='sub-title-area'>{this.state.selectedEndArea}</Text>
                  <View style={{ width: '55px' }}></View>
                </View>
                {this.state.selectedEndArea === "" && (
                  <AtGrid
                    hasBorder={false}
                    columnNum={3}
                    data={this.state.endAreaList.map(area => ({
                      value: area.includes('（') ? area.replace('（', '\n(').replace('）', ')') : area,
                    }))}
                    onClick={(item, index) => this.handleEndAreaClick(index)}
                  />
                )}
              </View>
            </View>
          )}
          {this.state.stepCurrent === 1 && !this.state.loading && (
            <>
              {/* Start Location Picker */}
              <View className='page-section' >
                <View className='step-one-container'>
                  <Text className='section-title'>{I18n.departure}</Text>
                  <AtButton className='reset-button' type='primary'
                    onClick={() => !this.state.loading && this.setState({ stepCurrent: 0 })}
                  >{I18n.back}</AtButton>
                </View>
                <Picker
                  mode='selector'
                  range={location.filter(lc => lc.on === "true").map(locations => `${locations.cname}`)}
                  onChange={this.onStartLoaciontChange}
                  defaultValue={0}
                  value={selectedStartLocationIndex}
                >
                  <AtList>
                    <AtListItem
                      className='location-item'
                      title={I18n.place}
                      extraText={this.state.selectedStartLocation + " "}
                      arrow='down'
                      extraThumb={this.state.selectedStartLocationAddress}
                    />
                  </AtList>
                </Picker>

                <AtListItem
                  title={I18n.address}
                  note={this.state.selectedStartLocationAddress}
                  extraText={<AtIcon value='map-pin' size='30' color='red' />}
                  onClick={() => this.openMap(this.state.selectedStartLocationLatitude, this.state.selectedStartLocationLongitude, this.state.selectedStartLocationAddress, this.state.selectedStartLocation)} />
              </View>

              {/* End Location Picker */}
              <View className='page-section'>
                <Text className='section-title'>{I18n.destination}</Text>
                <Picker
                  mode='selector'
                  range={location.filter(lc => lc.on === "false").map(locations => `${locations.cname}`)}
                  onChange={this.onEndLoaciontChange}
                  defaultValue={0}
                  value={selectedEndLocationIndex}
                >
                  <AtList>
                    <AtListItem
                      className='location-item'
                      title={I18n.place}
                      extraText={this.state.selectedEndLocation + " "}
                      arrow='down'
                    />
                  </AtList>
                </Picker>

                <AtListItem
                  title={I18n.address}
                  note={this.state.selectedEndLocationAddress}
                  extraText={<AtIcon value='map-pin' size='30' color='red' />}
                  onClick={() => this.openMap(this.state.selectedEndLocationLatitude, this.state.selectedEndLocationLongitude, this.state.selectedEndLocationAddress, this.state.selectedEndLocation)}
                />
              </View>

              <View className='page-section'>
                <Text className='section-title'>{I18n.date}</Text>
                <AtCalendar currentDate={''} minDate={dayjs().format('YYYY-MM-DD')} maxDate={dayjs().add(1, 'month').format('YYYY-MM-DD')} onDayClick={this.onDateChange} />
              </View>

              {this.state.dateSel !== '' && ticketData.length !== 0 && (
                <>
                  <Text className='section-title'>{I18n.selectSchedule}</Text>
                  {this.state.routeTimeLoading ? (
                    <AtList>
                      <AtListItem
                        title={I18n.scheduleTime}
                        extraText={I18n.loadingEllipsis}
                      />
                    </AtList>
                  ) : (
                    <>
                      <Picker
                        mode='selector'
                        range={ticketData?.map(ticket => ticket.runTime.substring(0, 5))}
                        onChange={this.onTicketChange}
                        value={selectedTicketIndex}
                        disabled={this.state.routeTimeLoading || ticketData.length === 0}
                      >
                        <AtList>
                          <AtListItem
                            className={`ticketTime ${ticketData.length === 0 ? 'error' : ''}`}
                            title={I18n.scheduleTime}
                            extraText={ticketData.length === 0 ? I18n.pleaseSelectNewDate : (selectedTicket && selectedTicket.runTime ? selectedTicket.runTime.substring(0, 5) : I18n.pleaseSelect)}
                            arrow={ticketData.length === 0 ? undefined : 'down'}
                          />
                        </AtList>
                      </Picker>

                      {selectedTicket?.tpa && (
                        <>
                          <AtList>
                            {this.state.isDiscount ? (
                              <>
                                <AtListItem
                                  className="original-price"
                                  title={I18n.price}
                                  extraText={`$${this.state.addedTickets.reduce((total, tpa) =>
                                    total + (parseFloat(tpa.fee) / parseFloat(this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(selectedTicket?.laRouteId)]) || 0), 0).toFixed(0)}`}
                                />
                                <AtListItem
                                  className="discount-display"
                                  title={`${this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(selectedTicket?.laRouteId)].split('.')[1]}${I18n.discount}`}
                                  extraText={`${I18n.discountPrice} $${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) || 0), 0).toFixed(0)}`}
                                />
                              </>
                            ) : (
                              <AtListItem
                                title={I18n.price}
                                extraText={`$${this.state.addedTickets.reduce((total, tpa) => total + (parseFloat(tpa.fee) || 0), 0).toFixed(0)}`}
                              />
                            )}
                          </AtList>

                          {/* Handle both array and single ticket types */}
                          {(() => {
                            const tpas = Array.isArray(selectedTicket.tpa)
                              ? selectedTicket.tpa
                              : [selectedTicket.tpa];

                            return tpas.map(tpa => {
                              const price = this.state.isDiscount
                                ? (parseFloat(tpa.fee) / parseFloat(this.state.routeIdDiscountPrice[this.state.routeIdDiscountID.indexOf(selectedTicket?.laRouteId)]) || 0).toFixed(0)
                                : (parseFloat(tpa.fee) || 0).toFixed(0);

                              return (
                                <AtList key={tpa.ticketTypeId}>
                                  <AtListItem
                                    className={`ticket-item ${this.state.isTicketHighlighted ? 'highlighted-ticket' : ''}`}
                                    title={`${tpa.ticketType}: $${price}`}
                                    extraText={
                                      <AtInputNumber
                                        min={0} step={1} size='normal' type='number'
                                        value={ticketQuantities[selectedTicket?.runId]?.[tpa.ticketTypeId]?.length || 0}
                                        onChange={(value) => this.handleQuantityChange(
                                          selectedTicket?.runId,
                                          tpa.ticketTypeId,
                                          value,
                                          selectedTicket.seatNum
                                        )}
                                      />
                                    }
                                    hasBorder={true}
                                    iconInfo={{ size: 20, color: "dark-green", value: "money" }}
                                  />
                                </AtList>
                              )
                            })
                          })()}
                        </>
                      )}
                    </>
                  )}
                </>
              )}


              {showTicketInfo && (<>
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

                <AtCheckbox
                  options={checkboxOption}
                  selectedList={isCheckBoxClicked ? ['agree'] : []}
                  onChange={this.handleCheckBoxChange}
                  className={this.state.isCheckboxHighlighted ? 'highlighted-checkbox' : ''}
                />

                <View className='confirm-button'>
                  <AtButton type='primary'
                    disabled={this.state.loading}
                    loading={this.state.loading}
                    onClick={() => !this.state.loading && this.handleConfirmSelection()}
                  >{I18n.submit}</AtButton>
                </View>
              </>

              )}
            </>
          )}
        </View>
      </View >
    );
  }
}
