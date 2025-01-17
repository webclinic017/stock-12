import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import DeleteIcon from "@material-ui/icons/Delete";
import { map } from "lodash";
import PropTypes from "prop-types";
import React, { useState, useContext } from "react";
import { useMutate } from "restful-react";

import StockSymbol from "src/components/stock/StockSymbol";
import GlobalContext from "src/context";

export default function DeleteSectorDialog(props) {
  const { host } = useContext(GlobalContext);
  const { resource_uri: sector, stocks_detail: stocks } = props;
  const [open, setOpen] = useState(false);

  const { mutate: del } = useMutate({
    verb: "DELETE",
    path: `${host}${sector}`,
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const on_sector_delete = () => {
    del().then(setOpen(false));
  };

  const stock_links = map(stocks, (v) => {
    return (
      <ListItem key={v.id}>
        <StockSymbol {...v} />
      </ListItem>
    );
  });

  return (
    <Box flexDirection="row">
      <Button color="primary" onClick={handleClickOpen}>
        <DeleteIcon />
        Delete sector
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle>Delete Sector</DialogTitle>
        <DialogContent>
          Deleting this sector will NOT delete stocks associated w/ it. Stock
          belonging to no sector, however, will not be visible in the sector
          page. You can go to the stock detail page and add it to a new sector.
          <Box mt={2}>
            <List>{stock_links}</List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={on_sector_delete}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

DeleteSectorDialog.propTypes = {
  resource_uri: PropTypes.string.isRequired,
  stocks_detail: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      symbol: PropTypes.string,
    }),
  ).isRequired,
};
