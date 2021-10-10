import {
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
} from "@material-ui/core";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import TrendingDownIcon from "@material-ui/icons/TrendingDown";
import TrendingUpIcon from "@material-ui/icons/TrendingUp";
import MDEditor from "@uiw/react-md-editor";
import PropTypes from "prop-types";
import React, { useState, useContext, useEffect } from "react";
import { useMutate } from "restful-react";

import SimpleSnackbar from "src/components/common/SimpleSnackbar";
import GlobalContext from "src/context";

export default function AddDiaryEditor(props) {
  const { api } = useContext(GlobalContext);
  const [resource] = useState("/diaries");
  const [comment, setComment] = useState("");
  const { stock: stock_id, to_refresh } = props;
  const [prediction, setPrediction] = useState(1);
  const [notification, setNotification] = useState("");

  const { mutate: create } = useMutate({
    verb: "POST",
    path: `${api}${resource}/?`,
  });

  // call API and close this dialog
  const on_create = () => {
    const msg = "New note has been saved.";

    create({
      stock: stock_id ? `/api/v1/stocks/${stock_id}/` : null,
      content: comment,
      judgement: prediction,
    })
      .then(setComment(""))
      .then(setNotification(msg));
  };

  useEffect(() => {
    return () => to_refresh();
  }, [to_refresh]);

  const prediction_change = (event) => {
    setPrediction(parseInt(event.target.value));
  };

  const judgement_selection = (
    <FormControl component="fieldset">
      <FormLabel component="legend">
        How would this stock perform next?
      </FormLabel>
      <RadioGroup
        aria-label="judgement"
        name="judgement"
        value={prediction}
        onChange={prediction_change}
        row
      >
        <FormControlLabel
          value={1}
          control={<Radio />}
          label={<TrendingUpIcon />}
        />
        <FormControlLabel
          value={2}
          control={<Radio />}
          label={<TrendingDownIcon />}
        />
      </RadioGroup>
    </FormControl>
  );

  return (
    <>
      <Typography variant="body2">
        Write down your thoughts. This helps to track your ideas and we can look
        back at this moment to validate how well the idea has played out.
      </Typography>
      <Box mt={2}>
        <MDEditor
          value={comment}
          onChange={setComment}
          height={500}
          preview="edit"
        />
      </Box>
      <Box mt={2}>{judgement_selection}</Box>
      <Box mt={1} justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={on_create}>
          Save
        </Button>
      </Box>

      <SimpleSnackbar msg={notification} />
    </>
  );
}

AddDiaryEditor.propTypes = {
  stock: PropTypes.number,
  to_refresh: PropTypes.func.isRequired,
};
