import React, { Component } from "react";
import classNames from "classnames";
import { map, filter, sortBy } from "lodash";
import { Jumbotron } from "react-bootstrap";
import { DebounceInput } from "react-debounce-input";
import ToggleDetails from "../shared/toggle_details.jsx";
import Fetch from "../shared/fetch.jsx";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
} from "react-router-dom";
import { StockDetail } from "./detail.jsx";

class StockList extends Fetch {
  constructor(props) {
    super(props);
    this.state.resource = "/api/v1/stocks";
    this.state.searching = "SBUX";

    // binding
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    const tmp = event.target.value.trim().toUpperCase();

    this.setState({
      searching: tmp,
    });
  }

  render_data(data) {
    const url_root = this.state.resource;

    const stocks = data.objects;

    // filter based on search string
    const filtered = filter(stocks, x =>
      x.symbol.includes(this.state.searching)
    );

    // routing to detail page
    const details = map(stocks, v => {
      // this value must match w/ NavLink `to` value!
      const tmp = "/stock/" + v.id;

      const resource = url_root + "/" + v.id;
      return (
        <Route
          key={v.id}
          path={tmp}
          children={props => (
            <StockDetail
              key={v.id}
              id={v.id}
              resource={resource}
              {...this.props}
            />
          )}
        />
      );
    });

    // when select
    const selectors = map(
      sortBy(filtered, x => x.symbol),
      v => {
        const url = "/stock/" + v.id;
        return (
          <NavLink
            activeClassName="active"
            className="col l4 m6 s12 "
            key={v.id}
            to={url}
          >
            <i className="fa fa-code-fork"></i>
            &nbsp;{v.symbol}
          </NavLink>
        );
      }
    );

    // presentation of the selector
    const pick = (
      <Jumbotron className="row">
        <DebounceInput
          className="input-field"
          debounceTimeout={500}
          value={this.state.searching}
          onChange={this.handleChange}
        />

        {selectors}
      </Jumbotron>
    );

    return (
      <Router>
        <div>
          <ToggleDetails details={pick} show="true" title="Select a stock" />

          <Switch>{details}</Switch>
        </div>
      </Router>
    );
  }
}

export default StockList;
