import React, { useContext } from "react";
import StockHistoricalContext from "src/views/stock/StockHistoricalView/context";
import PriceReturnStat from "src/components/stock/PriceReturnStat";
import {
  overnight_returns,
  overnight_return_stats,
} from "src/utils/stock/returns";

export default function OvernightReturnView() {
  const { olds: prices } = useContext(StockHistoricalContext);
  const returns = overnight_returns(prices);
  const stats = overnight_return_stats(prices);
  const data = { ...{ name: "Overnight Return", returns, stats } };
  return <PriceReturnStat data={data} />;
}
