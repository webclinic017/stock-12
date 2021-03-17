import React, { useState, useContext } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Box, Grid, Card, CardContent, Typography } from "@material-ui/core";
import GlobalContext from "src/context";
import FinancialsView from "src/views/stock/FinancialsView";
import Fetch from "src/components/fetch.jsx";
import DictCard from "src/components/dict_card.jsx";

function StockSummaryView() {
  const { id } = useParams();
  const { api } = useContext(GlobalContext);
  const [resource] = useState(`/stocks/${id}`);

  const interests = {
    latest_close_price: "Latest Close Price",
    last_reporting_date: "Last Reporting Date",
    profit_margin: "Profit Margin %",
    beta: "BETA",
    top_ten_institution_ownership: "Top 10 Institution Owned %",
    roa: "ROA",
    roe: "ROE",
    dupont_roe: "DuPont ROE",
    roe_dupont_reported_gap: "ROE Gap %",
  };

  const render_data = data => {
    return (
      <Box mt={3}>
        <Typography variant="h1">{data.symbol}</Typography>
        <DictCard {...{ data, interests }} />
      </Box>
    );
  };

  return <Fetch {...{ api, resource, render_data }} />;
}

export default StockSummaryView;
