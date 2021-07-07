import React from "react";
import {
  Grid,
  Link,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  List,
  ListItem,
  Typography,
} from "@material-ui/core";
import PropTypes from "prop-types";
import { map } from "lodash";
import ColoredNumber from "src/components/ColoredNumber";

export default function MoverCard(props) {
  const { title, subtitle, stocks, value, date } = props;

  const entries = map(stocks, s => {
    const val = s[value];

    return (
      <ListItem key={s.symbol} divider={true}>
        <Grid container spacing={2}>
          <Grid item xs>
            <ColoredNumber val={s[value]} />
          </Grid>
          <Grid item xs>
            <Link href={`/stocks/${s.stock_id}/historical/price`}>
              {s.symbol}
            </Link>
          </Grid>
        </Grid>
      </ListItem>
    );
  });

  return (
    <Card>
      <CardHeader
        title={<Typography variant="h3">{title}</Typography>}
        subheader={
          <Typography variant="body2" color="textSecondary">
            {subtitle}
          </Typography>
        }
      />
      <CardContent>
        <List>{entries}</List>
      </CardContent>
      <CardActions>
        <Grid container justify="flex-end">
          <Typography variant="body2">on {date}</Typography>
          <Link href={`/dashboard/trend`}>&rArr;</Link>
        </Grid>
      </CardActions>
    </Card>
  );
}

MoverCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  stocks: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
};
