interface GetTicketInfo {
  ticketId: string; // Ticket ID
  ticketCatory: string; // Ticket category ID
  ticketType: string; // Ticket type ID
  goOnAreaId: string; // Departure area ID
  goOnArea: string; // Departure area name
  goOffAreaId: string; // Arrival area ID
  goOffArea: string; // Arrival area name
  getOnStop: string; // Departure stop name (derived from Line_BeginStop_ID)
  getOffStop: string; // Arrival stop name (derived from Line_EndStop_ID)
  Line_BeginStop_ID: string; // Departure stop ID
  Line_EndStop_ID: string; // Arrival stop ID
  signFlag: string; // Ticket status (e.g., 2 for available)
  order_Time: string; // Purchase date
  ETicketNO: string; // Electronic ticket number
  EfflimitTime: string; // Validity period
  Line_Date: string; // Departure date
  line_Stop_Time: string; // Departure time
  barginPrice: string; // Bargain price
  fristPrice: string; // First price
  originPrice: string; // Original price
  currencyID: string; // Currency ID
  isLocked: string; // Whether the ticket is locked
  isPrePay: string; // Whether the ticket is prepaid
  isRoundtrip: string; // Round trip status
  passenger_Name: string; // Encrypted passenger name
  passenger_Phone: string; // Passenger phone
  mainOrder_No: string; // Main order number
  settlePrice: string; // Settled price
  routeId: string; // Route ID
  seat: string; // Seat number
  ticketCategoryName: string; // Ticket category name
  ticketSpecies: string; // Ticket species ID
  takeTicketCode: string; // Take ticket code
  userName: string; // User name (merchant name)
  youhuiFee: string; // Discount amount
  signFlagDescription: string; // Sign flag description (e.g., '7-车票已过期')
  states: string; // Ticket state
  errorCode: string; // Error code (optional, if applicable)
  errorMsg: string; // Error message (optional, if applicable)
}

export interface GetTicketInfoResponse {
  ticketApplayStock: GetTicketInfo;
}