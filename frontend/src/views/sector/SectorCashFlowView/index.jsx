import React, { useState, useContext } from "react";

import SectorDetailContext from "src/views/sector/SectorDetailView/context.jsx";
import SectorStatementComparisonCharts from "src/components/sector/SectorStatementComparisonCharts";
import { map } from "lodash";
import { Box, Typography } from "@material-ui/core";

export default function SectorCashFlowView() {
  const sector = useContext(SectorDetailContext);
  const stock_ids = map(sector.stocks_property, s => s.id).join(",");
  const [resource] = useState(`/cashes?stock__in=${stock_ids}`);
  return (
    <Box>
      <Typography variant={"h1"}>Cash Flow Statement Comparisons</Typography>
      <Box mt={3}>
        <SectorStatementComparisonCharts resource={resource} />
      </Box>
    </Box>
  );
}