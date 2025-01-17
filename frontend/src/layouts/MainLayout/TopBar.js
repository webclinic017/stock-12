import {
  AppBar,
  Box,
  Hidden,
  IconButton,
  Toolbar,
  makeStyles,
} from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import clsx from "clsx";
import PropTypes from "prop-types";
import React from "react";
import { Link as RouterLink } from "react-router-dom";

import LogoutIcon from "src/components/auth/LogoutIcon";
import Logo from "src/components/common/Logo";
import AddNewStockDialog from "src/components/stock/AddNewStockDialog";
import TaskNotificationIcon from "src/components/task/TaskNotificationIcon";

const useStyles = makeStyles(() => ({
  root: {},
  avatar: {
    width: 60,
    height: 60,
  },
}));

const TopBar = ({ className, onMobileNavOpen, ...rest }) => {
  const classes = useStyles();

  return (
    <AppBar className={clsx(classes.root, className)} elevation={0} {...rest}>
      <Toolbar>
        <RouterLink to="/">
          <Logo />
        </RouterLink>

        <Box flexGrow={1} />
        <AddNewStockDialog />
        <TaskNotificationIcon />
        <LogoutIcon />
        <Hidden lgUp>
          <IconButton color="inherit" onClick={onMobileNavOpen}>
            <MenuIcon />
          </IconButton>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
};

TopBar.propTypes = {
  className: PropTypes.string,
  onMobileNavOpen: PropTypes.func,
};

export default TopBar;
