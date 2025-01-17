import React, { useContext } from "react";

import PriceReturnStat from "src/components/stock/PriceReturnStat";
import {
  twenty_four_hour_returns,
  twenty_four_hour_stats,
} from "src/utils/stock/returns";
import StockHistoricalContext from "src/views/stock/StockHistoricalView/context";

export default function TwentyFourHourReturnView() {
  const data = useContext(StockHistoricalContext);
  const returns = twenty_four_hour_returns(data);
  const stats = twenty_four_hour_stats(data);
  const p = { ...{ name: "Return of 24-hour", returns, stats } };
  return <PriceReturnStat data={p} />;
}
