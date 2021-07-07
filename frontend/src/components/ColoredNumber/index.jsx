import React from "react";
import { makeStyles } from "@material-ui/styles";
import { Typography } from "@material-ui/core";
import { map, isNumber } from "lodash";
import clsx from "clsx";
import PropTypes from "prop-types";

// A style sheet
const useStyles = makeStyles(theme => ({
  positive: {
    color: "green",
  },
  negative: {
    color: "#d52349",
  },
  zero: {
    color: "orange",
  },
}));

export default function ColoredNumber(props) {
  const classes = useStyles();
  const { val, unit } = props;

  if (!!!val) {
    return (
      <Typography variant="body2" color="error" display="inline">
        No data found.
      </Typography>
    );
  }

  const style_me = val => {
    let color = null;

    if (isNumber(val)) {
      if (val < 0) {
        color = clsx(classes.negative);
      } else if (val === 0) {
        color = clsx(classes.zero);
      } else {
        color = clsx(classes.positive);
      }
    } else {
      return (
        <Typography variant="body2" color="textPrimary">
          {val ? val : "Not Available"}
        </Typography>
      );
    }
    return (
      <Typography
        variant="body2"
        color="textPrimary"
        className={color}
        display="inline"
      >
        {val.toFixed(2)}
        {!!unit ? unit : null}
      </Typography>
    );
  };

  return style_me(val);
}

ColoredNumber.propTypes = {
  val: PropTypes.number.isRequired,
  unit: PropTypes.string,
};