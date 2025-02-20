interface DepartureZL {
    count: string;
    errorCode: string;
    errorMsg: string;
    overdueNum: string;
    run: Ticket[];
  }
  
  interface Ticket {
    allSeatNum: string;
    arriveTime: string;
    errorCode: string;
    errorNotes: string;
    goTripDesc: string;
    laCompanyName: string;
    laRouteId: string;
    la_beginstops: string;
    la_endstops: string;
    la_time: string;
    lineIsShuttle: string;
    note: string;
    overdueNum: string;
    portId: string;
    realNameRequired: string;
    runCode: string;
    runId: string;
    runStartTime: string;
    runTime: string;
    saleNum: string;
    seatNum: string;
    tpa: Tpa | Tpa[];
    tripDesc: string;
  }
  
  interface Tpa {
    afeeF: string;
    beginStopId: string;
    beginStopName: string;
    beginStopPre: string;
    currencyStr: string;
    datePre: string;
    endStopId: string;
    endStopName: string;
    endStopPre: string;
    fee: string;
    id: string;
    lineTimePre: string;
    PJisRoundtrip: string;
    pageInfo: string;
    paliasName: string;
    pid: string;
    pjisRoundtrip: string;
    pricesStr: string;
    proxyDIsCountPre: string;
    proxyPre: string;
    routePriceStr: string;
    runTime: string;
    settingMethod: string;
    spareField1: string;
    spareField2: string;
    spareField3: string;
    spareField4: string;
    spareField5: string;
    spareField6: string;
    ticketCategoryId: string;
    ticketCategoryLineId: string;
    ticketCategoryName: string;
    ticketType: string;
    ticketTypeId: string;
    tuiPre: string;
    youhuidiscount: string;
    yuSeatPre: string;
    yufuPre: string;
  }
  