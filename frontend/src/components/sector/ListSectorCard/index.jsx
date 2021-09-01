import React, { useState } from "react";

import ListStockCard from "src/components/stock/ListStockCard";
import { map, sortBy } from "lodash";

import EditSectorDialog from "src/components/sector/EditSectorDialog";
import DeleteSectorDialog from "src/components/sector/DeleteSectorDialog";
import { Button, Link } from "@material-ui/core";
import MultilineChartIcon from "@material-ui/icons/MultilineChart";
import ShowResource from "src/components/common/ShowResource";

export default function ListSectorCard(props) {
  const { me, all } = props;
  const [resource] = useState(`/sectors/${me.id}`);

  const existing_names = map(all, (a) => a.name);

  const render_data = (sector) => {
    const actions = [
      <Button
        key={me.id}
        component={Link}
        href={`/sectors/${me.id}/price`}
        variant="text"
        color="primary"
      >
        <MultilineChartIcon />
        Comparison analysis
      </Button>,

      <EditSectorDialog {...me} existings={existing_names} />,
      <DeleteSectorDialog {...sector} />,
    ];

    const stocks = sortBy(sector.stocks_detail, (s) => s.symbol);

    return <ListStockCard {...{ actions, stocks, index: sector.name }} />;
  };

  // render as usual to get data
  return (
    <ShowResource {...{ resource, on_success: render_data, silent: true }} />
  );
}
