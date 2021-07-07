import React from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import {
  makeStyles,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  Divider,
  Grid,
  Link,
} from "@material-ui/core";
import CalendarTodayIcon from "@material-ui/icons/CalendarToday";
import SectorLabel from "src/components/stock/SectorLabel";
import { map, isUndefined } from "lodash";
import DropdownMenu from "src/components/DropdownMenu";
import RecentPriceSparkline from "src/components/stock/RecentPriceSparkline";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  avatar: {
    backgroundColor: "#d52349",
    height: 56,
    width: 56,
  },
  card: {
    height: "100%",
  },
}));

export default function ListStockCard(props) {
  const { stocks, index, group_by, actions } = props;
  const classes = useStyles();

  let title;
  switch (group_by) {
    case "last_reporting_date":
      title = index === "null" ? "ETF" : index;
      break;

    case "sector":
      title = <SectorLabel resource={index} />;
      break;

    default:
      title = index;
      break;
  }

  // if any menu contents
  let menu_content = null;

  if (!isUndefined(actions)) {
    const action_menu_content_list = map(actions, (action, index) => (
      <ListItem key={index}>{action}</ListItem>
    ));
    menu_content = <List>{action_menu_content_list}</List>;
  }

  const links = map(stocks, s => {
    return (
      <Grid key={s.id} container spacing={1} alignItems="center">
        <Grid item xs={2}>
          <Link href={`/stocks/${s.id}/historical/price`}>{s.symbol}</Link>
        </Grid>
        <Grid item xs={5}>
          <RecentPriceSparkline stock={s.id} />
        </Grid>
      </Grid>
    );
  });

  return (
    <Card className={clsx(classes.root, classes.card)}>
      <CardHeader
        title={<Typography variant="h3">{title}</Typography>}
        subheader={<Typography variant="body2">{group_by}</Typography>}
        avartar={
          <Avatar className={classes.avatar}>
            <CalendarTodayIcon />
          </Avatar>
        }
        action={<DropdownMenu content={menu_content} />}
      />

      <Divider />
      <CardContent>{links}</CardContent>
    </Card>
  );
}

ListStockCard.propTypes = {
  index: PropTypes.string.isRequired,
  group_by: PropTypes.string,
  stocks: PropTypes.arrayOf(PropTypes.any),
  actions: PropTypes.arrayOf(PropTypes.any),
};
