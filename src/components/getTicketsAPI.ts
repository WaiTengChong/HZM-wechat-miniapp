interface GetTicketsResponse {
    cost: string;
    depatureDestinatId: string;
    depatureDestinatName: string;
    depatureDestinatNameEn: string;
    depatureOriginId: string;
    depatureOriginName: string;
    depatureOriginNameEn: string;
    efflimitTime: string;
    isRoundtrip: string;
    offAddress: string;
    offAddressEn: string;
    onAddress: string;
    onAddressEn: string;
    passenger: string;
    passengerEmails: string | null;
    passenger_flightNo: string | null;
    printStatus: string;
    printStatusName: string;
    runDate: string;
    runTime: string;
    seats: string;
    secondLineId: string;
    status: string;
    statusName: string;
    takeTicketCode: string;
    tel: string;
    ticketCategory: string;
    ticketCode: string;
    trip: string;
}

export interface TicketResponse {
  errorCode: string;
  errorMsg: string;
  integral: string;
  msg: string;
  orderCost: string;
  orderDetailLst: GetTicketsResponse | GetTicketsResponse[];
  orderNo: string;
}
