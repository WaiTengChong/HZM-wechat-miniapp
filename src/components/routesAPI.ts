interface ReverseRoute {
  fromCityCName: string;
  fromCityEName: string;
  fromCityId: string;
  fromCityName: string;
  fromStations: string;
  isShotOrLong: string;
  routeCName: string;
  routeCode: string;
  routeDirection: string;
  routeEName: string;
  routeId: string;
  routeIdStr: string;
  routeName: string;
  routeStatu: string;
  toCityCName: string;
  toCityEName: string;
  toCityId: string;
  toCityName: string;
  toStations: string;
}

interface Route {
  fromCityCName: string;
  fromCityEName: string;
  fromCityId: string;
  fromCityName: string;
  fromStations: string;
  isShotOrLong?: string;
  routeCName: string;
  routeCode: string;
  routeDirection: string;
  routeEName: string;
  routeId: string;
  routeIdStr: string;
  routeName: string;
  routeStatu: string;
  toCityCName: string;
  toCityEName: string;
  toCityId: string;
  toCityName: string;
  toStations: string;
  reverse: ReverseRoute;
}

interface DepartureZL {
  route: Route[];
  url: string;
}

// Define interfaces for the route data and API response
interface Route {
  routeCName: string;
  routeEName: string;
  fromCityName: string;
  toCityName: string;
  routeId: string;
}

interface State {
  route: Route[];
  selectorChecked: string;
  selectorIndex: number;
  dateSel: string;
  selectedRouteId: string;
  loading: boolean;
  startLocation: string;
  endLocation: string;
  location: Location[];
  stepCurrent: number;
  selectedStartLocation: string;
  selectedStartLocationAddress: string;
  selectedEndLocation: string;
  selectedEndLocationAddress: string;
  selectedStartLocationIndex: number;
  selectedEndLocationIndex: number;
  startLocations: Location[];
  endLocations: Location[];
  selectedStartArea: string;
  selectedEndArea: string;
  startAreaList: string[];
  endAreaList: string[];
  ticketData: Ticket[];
  selectedTicketIndex: number;
  selectedTicket: Ticket;
  routeTimeLoading: boolean;
  checkboxOption: { value; label; desc }[];
  isCheckBoxClicked: boolean;
  ticketQuantities: {
    [ticketId: string]: {
      [tpaId: string]: {
        passengers: string;
        passengerTels: string;
        ticketTypeId: string;
        ticketCategoryName: string;
        ticketCategoryLineId: string;
      }[];
    };
  };
  addedTickets: Tpa[];
  routeIdDiscountID: string[];
  routeIdDiscountPrice: string[];
  isDiscount: boolean;
  departureOriginId: string;
  departureDestinationId: string;
  showTicketInfo: boolean;
}