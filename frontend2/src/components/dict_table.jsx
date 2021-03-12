import React from "react";
import classNames from "classnames";
import { useTheme } from "@material-ui/core/styles";
import { map, isEmpty, isNull } from "lodash";
import { randomId } from "src/utils/helper.jsx";
import HighchartGraphBox from "./graph-highchart.jsx";
import Page from "src/components/Page";

import Box from "@material-ui/core/Box";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

function DictTable(props) {
  const theme = useTheme();
  const { data, interests, chart } = props;

  if (isEmpty(data)) {
    return <Box>No data found.</Box>;
  }

  const dates = map(data, i => <TableCell key={i.on}>{i.on}</TableCell>);

  const rows = Object.entries(interests).map(([key, description]) => {
    const row = map(data, c => {
      const decor = classNames(
        c[key] < 0 ? theme.td.negative : null,
        c[key] == 0 ? theme.td.zero : null
      );

      if (isNull(c[key])) {
        console.log(c);
        console.log(key);
      }

      return (
        <TableCell key={c.on} className={decor}>
          {c[key].toFixed(2)}
        </TableCell>
      );
    });
    return (
      <TableRow key={key}>
        <TableCell component="th" scope="row">
          {description}
        </TableCell>
        {row}
      </TableRow>
    );
  });

  return (
    <Box>
      <Box mb={3}>
        <TableContainer component={Paper}>
          <Table className={theme.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                {dates}
              </TableRow>
            </TableHead>
            <TableBody>{rows}</TableBody>
          </Table>
        </TableContainer>
      </Box>

      {chart ? <Chart {...props} /> : null}
    </Box>
  );
}

function Chart(props) {
  const containerId = randomId();
  const { data, interests } = props;
  const dates = map(data, i => i.on);
  const chart_data = Object.entries(interests).map(([key, description]) => {
    const vals = map(data, i => i[key]);
    return { name: description, data: vals };
  });

  return (
    <HighchartGraphBox
      containerId={containerId}
      type="line"
      categories={dates}
      yLabel=""
      title=""
      legendEnabled={true}
      data={chart_data}
      normalize={true}
    />
  );
}

export default DictTable;