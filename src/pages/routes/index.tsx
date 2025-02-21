import { Picker, Text, View } from '@tarojs/components';
import Taro from "@tarojs/taro";
import dayjs from 'dayjs';
import { Component } from 'react';
import { AtActivityIndicator, AtButton, AtCalendar, AtDivider, AtGrid, AtList, AtListItem, AtSteps } from 'taro-ui';
import "taro-ui/dist/style/components/button.scss"; // 按需引入
import { fetchRoutesAPILocal, getDeparturesZL, getLocationByRoute } from "../../api/api";
import { RemoteSettingsService } from '../../services/remoteSettings';
import './index.scss';

export default class Routes extends Component<{}, State> {
  // Initialize state
  state: State = {
    route: [],
    location: [],
    selectorChecked: '',
    selectorIndex: 0,
    selectedRouteId: '',
    dateSel: dayjs().format('YYYY-MM-DD'),
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
    selectedStartLocationIndex: 0,
    selectedEndLocationIndex: 0,
    selectedStartArea: '',
    selectedEndArea: '',
    startAreaList: [],
    endAreaList: [],
    ticketData: [],
    selectedTicketIndex: 0,
    selectedTicket: null,
  };

  // Fetch data from the API when the component mounts
  async componentDidMount() {
    try {
      // Initialize RemoteSettings if not already initialized
      await RemoteSettingsService.getInstance().initialize();
      
      const response = await fetchRoutesAPILocal();
      if (response.route && Array.isArray(response.route)) {
        const filteredRoute = RemoteSettingsService.getInstance().getList('routeId_allowed', []);
        console.log(filteredRoute);

        // Simplified route filtering logic
        const filteredRoutes = filteredRoute.length > 0 
          ? response.route.filter(route => filteredRoute.includes(route.routeId))
          : response.route;

        this.setState({
          route: filteredRoutes,
          startAreaList: [...new Set(filteredRoutes.map(route => route.fromCityCName))].filter(Boolean) as string[],
          endAreaList: [...new Set(filteredRoutes.map(route => route.toCityCName))].filter(Boolean) as string[],
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
      });
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

  handleReset = () => {
    this.setState({
      selectedStartArea: '',
      selectedEndArea: '',
      startAreaList: [...new Set(this.state.route.map(route => route.fromCityCName))].filter(Boolean) as string[],
      endAreaList: [...new Set(this.state.route.map(route => route.toCityCName))].filter(Boolean) as string[],

    })
  }

  onStepChange(stepCurrent: number) {
    // If at step 0, prevent moving forward
    if (this.state.stepCurrent === 0) {
      return; // Do nothing when trying to move forward from step 0
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
    this.setState({
      selectedStartLocationIndex: e.detail.value,
      selectedStartLocation: this.state.startLocations[e.detail.value].cname,
      selectedStartLocationAddress: this.state.startLocations[e.detail.value].address
    })
  }

  onEndLoaciontChange = (e: any) => {
    this.setState({
      selectedEndLocationIndex: e.detail.value,
      selectedEndLocation: this.state.endLocations[e.detail.value].cname,
      selectedEndLocationAddress: this.state.endLocations[e.detail.value].address
    })
  }

  // Handle date changes
  onDateChange = (e: any) => {
    this.setState({
      dateSel: e.value // Use e.date for date input
    });
  };

  onTicketChange = (e: any) => {
    const index = parseInt(e.detail.value);
    const selectedTicket = this.state.ticketData![index];
    this.setState({ 
      selectedTicket,
      selectedTicketIndex: index
    });
  };

  handleConfirmSelection = () => {
    const { selectedTicket } = this.state;
    if (!selectedTicket) {
      Taro.showToast({
        title: '請選擇一張車票',
        icon: 'none',
        duration: 2000
      });
    } else {
      Taro.setStorageSync('ticket', selectedTicket);
      Taro.navigateTo({
        url: `/pages/info/index`
      });
    }
  };

  // Render the component
  render() {
    const { route: routes, selectorChecked, selectedRouteId, selectorIndex, dateSel, loading, startLocation, endLocation,
      location, stepCurrent, selectedStartLocation, selectedStartLocationAddress, selectedEndLocation, selectedEndLocationAddress, selectedStartLocationIndex, selectedEndLocationIndex, startLocations, endLocations, ticketData, selectedTicketIndex, selectedTicket } = this.state;
    const items = [
      { 'title': '路線', 'desc': '出發地和目的地' },
      { 'title': '地點', 'desc': '具體上下車地點' },
      { 'title': '班次', 'desc': '合適班次' }
    ]

    return (
      <View className='container'>
        <View className='page-body'>
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
          {this.state.stepCurrent === 0 && !this.state.loading  && (
            <View className='page-section'>
              <View>
                <View className='step-one-container'>
                  <Text className='sub-title'>出發地</Text>
                  <Text className='sub-title-area'>{this.state.selectedStartArea}</Text>
                  {(this.state.selectedStartArea !== '' || this.state.selectedEndArea !== '') && (
                    <AtButton className='reset-button' type='primary' 
                      onClick={() => !this.state.loading && this.handleReset()}
                      disabled={this.state.loading}
                      loading={this.state.loading}
                    > 重置</AtButton>
                  )}
                </View>
                {this.state.selectedStartArea === "" && (
                  <AtGrid
                    columnNum={4}
                  data={this.state.startAreaList.map(area => ({
                    value: area,
                  }))}
                    onClick={(item, index) => this.handleStartAreaClick(index)}
                  />
                )}
                
                <View style={{ height: '20px' }}></View>

                <View className='step-one-container'>
                  <Text className='sub-title'>目的地</Text>
                  <Text className='sub-title-area'>{this.state.selectedEndArea}</Text>
                  <View style={{ width: '55px' }}></View>
                </View>
                {this.state.selectedEndArea === "" && (
                <AtGrid
                  columnNum={4}
                  data={this.state.endAreaList.map(area => ({
                    value: area,
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
                  <Text className='section-title'>出發</Text>
                  <AtButton className='reset-button' type='primary' 
                    onClick={() => !this.state.loading && this.setState({stepCurrent: 0})}
                  > 返回</AtButton>
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
                      title='地點'
                      extraText={this.state.selectedStartLocation+" "}
                      arrow='down'
                      extraThumb={this.state.selectedStartLocationAddress}
                    />
                  </AtList>
                </Picker>

                <AtListItem
                  title='位置'
                  note={this.state.selectedStartLocationAddress}
                />
              </View>

              {/* End Location Picker */}
              <View className='page-section'>
                <Text className='section-title'>到達</Text>
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
                      title='地點'
                      extraText={this.state.selectedEndLocation + " "}
                      arrow='down'
                    />
                  </AtList>
                </Picker>

                <AtListItem
                  title='位置'
                  note={this.state.selectedEndLocationAddress}
                />
              </View>

              <View className='page-section'>
                <Text className='section-title'>日期</Text>
                <AtCalendar minDate={dayjs().format('YYYY-MM-DD')} maxDate={dayjs().add(1, 'month').format('YYYY-MM-DD')} onDayClick={this.onDateChange} />
              </View>
{/* 
              <View className='page-section'>
                <Text className='section-title'>上車時間</Text>
                <Picker
                  mode='time'
                  onChange={this.onTimeChange}
                  defaultValue='15:00'
                  value={timeSel}
                >
                  <AtList>
                    <AtListItem
                      title='站點開車時間'
                      extraText={this.state.timeSel}
                    />
                  </AtList>
                </Picker>
              </View> */}

              <AtDivider content='訂票需知 ' />

              <View className='page-info'>
                <AtList>1. 所有車票只限票面上註明之日期及班次有效，乘客必須依照選定的日期及上車地點登車，過期無效。</AtList>
                <AtList>2. 乘客必須按車票上註明之班次於開車前15分鐘到達上車點候車，逾時不候，亦不獲退票。</AtList>
                <AtList>3. 兒童車票只適合3-5歲小童使用。</AtList>
                <AtList>4. 如需辦理預辦登機手續，平日請於航班起飛前3小時到達本公司票務中心辦理手續；而節日或週末前夕請於航班起飛前4小時到達本公司票務中心辦理手續。</AtList>
                <AtList>5. 香港市區與深圳寶安機場間之車程約為2小時 「不包括特殊路面交通情況及過關等候時間」。</AtList>
                <AtList>6. 乘客如因過關延誤，可轉乘本司下一班車前往目的地。</AtList>
                <AtList>7. 付款方式: Wechat Pay。</AtList>
                <AtList>8. 更改訂單: 所有訂單均不設任何取消及更改。</AtList>
                <AtList>9. 退款及退貨: 所有訂單均不設退款及退貨。</AtList>
              </View>

              <View className='confirm-button'>
                <AtButton type='primary' 
                  disabled={this.state.loading}
                  loading={this.state.loading}
                  onClick={async () => {
                    if (this.state.loading) return;
                    this.setLoading(true);
                    try {
                      const response: DepartureZL = await getDeparturesZL(
                        selectedRouteId,
                        location.find(lc => lc.cname === selectedStartLocation)?.id!,
                        location.find(lc => lc.cname === selectedEndLocation)?.id!,
                        0,
                        "",
                        dateSel
                      );
                      if (response.run != undefined && response.run.length > 0) {
                        this.setState({
                          ticketData: response.run,
                          stepCurrent: 2  // Automatically move to step 2
                        });
                        Taro.setStorageSync("ticket_date", dateSel);
                      } else {
                        Taro.showToast({ title: '没有可用的车票', icon: 'none' })
                      }
                    } finally {
                      this.setLoading(false);
                    }
                  }}
                >提交</AtButton>
              </View>
            </>
          )}

          {this.state.stepCurrent === 2 && !this.state.loading && (
            <View className='page-section'>
              <View className='step-two-container'>
                <Text className='section-title'>選擇班次</Text>
                <AtButton className='reset-button' type='primary' 
                  onClick={() => !this.state.loading && this.setState({stepCurrent: 1})}
                > 返回</AtButton>
              </View>
              {loading ? (
                <AtActivityIndicator mode='center' />
              ) : (
                <>
                  <Picker
                    mode='selector'
                    range={ticketData?.filter(ticket => {
                      if (dayjs(dateSel).isSame(dayjs(), "day")) {
                        // If today, filter times less than 1 hour from now
                        return dayjs(`${dateSel} ${ticket.runStartTime}`).isAfter(dayjs().add(1, 'hour'));
                      }
                      return true; // Show all times for future dates
                    }).map(ticket => 
                      `${ticket.runStartTime}`
                    )}
                    onChange={this.onTicketChange}
                    value={selectedTicketIndex}
                  >
                    <AtList>
                      <AtListItem
                        title='班次時間'
                        extraText={selectedTicket ? `${selectedTicket.runStartTime}` : '請選擇'}
                      />
                    </AtList>
                  </Picker>
                  <AtButton type='primary' 
                    className='confirm-button'
                    onClick={() => !this.state.loading && this.handleConfirmSelection()}
                    disabled={this.state.loading}
                    loading={this.state.loading}
                  >確認選擇</AtButton>
                </>
              )}
            </View>
          )}
        </View>
      </View >
    );
  }
}
