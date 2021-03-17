import React, { useContext } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
} from "@material-ui/core";

import StockHistoricalContext from "src/views/stock/StockHistoricalView/context.jsx";

import PriceTable from "./table.jsx";
import PriceChart from "./chart.jsx";
import DailyReturnView from "src/views/stock/DailyReturnView";
import OvernightReturnView from "src/views/stock/OvernightReturnView";

function PriceView() {
  const { olds: data } = useContext(StockHistoricalContext);
  return (
    <Grid container spacing={3}>
      <Grid item lg={6} sm={12} xs={12}>
        <Card>
          <CardContent>
            <PriceChart data={data} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <PriceTable data={data} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item lg={6} sm={12} xs={12}>
        <DailyReturnView />
        <OvernightReturnView />
      </Grid>
    </Grid>
  );
}

export default PriceView;
