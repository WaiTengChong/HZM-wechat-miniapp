import { Picker, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Component } from 'react';
import { AtActivityIndicator, AtButton, AtDivider, AtList, AtListItem } from 'taro-ui';
import './index.scss';

interface State {
    tickets: Ticket[];
    loading: boolean;
    ticketDate: string;
    selectedTicket: Ticket | null;
    selectedIndex: number;
}

export default class TicketSelection extends Component<{}, State> {
    state: State = {
        tickets: [],
        loading: true,
        selectedTicket: null,
        ticketDate: "",
        selectedIndex: 0
    };

    onTicketChange = (e) => {
        const index = parseInt(e.detail.value);
        const selectedTicket = this.state.tickets[index];
        this.setState({ 
            selectedTicket,
            selectedIndex: index
        });
    };

    handleConfirmSelection = () => {
        const { selectedTicket } = this.state;
        if (!selectedTicket) {
            Taro.showToast({
                title: '請選擇一個班次',
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

    componentDidMount() {
        const ticketData: Ticket[] = Taro.getStorageSync('ticketData');
        const ticketDate = Taro.getStorageSync('ticket_date');

        if (ticketData) {
            this.setState({
                tickets: ticketData,
                loading: false
            });
        } else {
            Taro.eventCenter.on('ticketDataUpdated', (data) => {
                this.setState({
                    tickets: data,
                    loading: false
                });
            });
        }
        if (ticketDate) {
            this.setState((prevState) => ({
                ...prevState,
                ticketDate
            }));
        }
    }

    componentWillUnmount() {
        Taro.eventCenter.off('ticketDataUpdated');
    }

    render() {
        const { tickets, loading, selectedTicket, selectedIndex } = this.state;

        if (loading) {
            return <AtActivityIndicator mode='center' />;
        }

        // Create range for picker
        const ticketOptions = tickets.map(ticket => `${ticket.runStartTime} - ¥${Array.isArray(ticket.tpa) ? ticket.tpa[0].pricesStr : ticket.tpa.pricesStr}`);

        return (
            <View className='container'>
                <View className='page-body'>
                    <View className='page-section'>
                        <Text className='section-title'>選擇班次</Text>
                        <Picker
                            mode='selector'
                            range={ticketOptions}
                            onChange={this.onTicketChange}
                            value={selectedIndex}
                        >
                            <AtList>
                                <AtListItem
                                    title='班次時間'
                                    extraText={selectedTicket ? `${selectedTicket.runStartTime}` : '請選擇'}
                                />
                            </AtList>
                        </Picker>
                        {selectedTicket && (
                            <AtList>
                                <AtListItem
                                    title='票價'
                                    extraText={`¥${Array.isArray(selectedTicket.tpa) ? selectedTicket.tpa[0].pricesStr : selectedTicket.tpa.pricesStr}`}
                                />
                                <AtListItem
                                title='班次ID'
                                    extraText={selectedTicket.runId}
                                />
                            </AtList>
                        )}
                    </View>
                    <AtDivider content='班次信息' />
                    <AtButton type='primary' onClick={this.handleConfirmSelection}>確認選擇</AtButton>
                </View>
            </View>
        );
    }
}
