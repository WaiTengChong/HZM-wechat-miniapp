interface Location {
    address: string;
    addressEName: string;
    areaId: string;
    areaName: string;
    cname: string;
    depature_lat: string;
    destination_long: string;
    ename: string;
    FN_Alias: string;
    FN_Alias_SA_Name_En: string;
    FN_Crossing: string;
    fnCode: string;
    fnIsactive: string;
    fnScenicSpots: string;
    fn_Alias_SA_EName: string;
    fn_Alias_SA_Name: string;
    id: string;
    lat: string;
    lon: string;
    name: string;
    on: string;
    prId: string;
    reverseStopId: string;
    reverseStopName: string;
    xcCName: string;
    xcEName: string;
    xcId: string;
    xcName: string;
    gN_Name_English: string;
  }
  
  interface LocationApi {
    locations: Location[];
    url: string;
  }
  