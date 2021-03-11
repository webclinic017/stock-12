import React, { Component } from "react";
import classNames from "classnames";
import { map, last, reverse, filter, isEmpty, isNull } from "lodash";
import { DebounceInput } from "react-debounce-input";
import Financials from "./financials.jsx";

class DCF extends Component {
  constructor(props) {
    super(props);

    // get capital structure from the latest balance sheet
    const { stock } = props;

    let capital_structure;
    let tmp = map(stock.balances, b => b.capital_structure);
    tmp = filter(reverse(tmp), x => x > 0);
    if (isEmpty(tmp)) {
      capital_structure = 0;
    } else {
      capital_structure = Math.floor(tmp[0]);
    }

    // get free cash flow from cach flow statements
    tmp = map(stock.cashes, b => b.free_cash_flow);
    tmp = filter(reverse(tmp), x => x > 0);
    const free_cash_flow = tmp[0];

    this.state = {
      risk_free: 1.242,
      market_premium: 7,
      cost_of_debt: 10,
      growth_rate: 7,
      project_year: 5,
      fcf: free_cash_flow,
      terminal_growth_rate: 1,
      capital_structure: capital_structure,
    };

    this.market_premium_change = this.market_premium_change.bind(this);
    this.cost_of_debt_change = this.cost_of_debt_change.bind(this);
    this.growth_rate_change = this.growth_rate_change.bind(this);
    this.capital_structure_change = this.capital_structure_change.bind(this);
    this.project_year_change = this.project_year_change.bind(this);
    this.terminal_growth_change = this.terminal_growth_change.bind(this);
    this.risk_free_change = this.risk_free_change.bind(this);
  }

  risk_free_change(event) {
    this.setState({
      risk_free: event.target.value,
    });
  }
  market_premium_change(event) {
    this.setState({
      market_premium: event.target.value,
    });
  }
  cost_of_debt_change(event) {
    this.setState({
      cost_of_debt: event.target.value,
    });
  }
  growth_rate_change(event) {
    this.setState({
      growth_rate: event.target.value,
    });
  }
  capital_structure_change(event) {
    this.setState({
      capital_structure: event.target.value,
    });
  }
  project_year_change(event) {
    this.setState({
      project_year: event.target.value,
    });
  }
  terminal_growth_change(event) {
    this.setState({
      terminal_growth_rate: event.target.value,
    });
  }

  render() {
    const { stock } = this.props;
    const {
      risk_free,
      market_premium,
      cost_of_debt,
      growth_rate,
      capital_structure,
      project_year,
      terminal_growth_rate,
      fcf,
    } = this.state;

    // if this is a ETF, skip
    if (isEmpty(stock.balances)) {
      return null;
    }

    const reported = {
      close_price: "Close Price",
    };
    const cost_of_equity =
      risk_free / 100 + (stock.beta * market_premium) / 100;
    const debt_cost = (cost_of_debt / 100) * (1 - stock.tax_rate);

    const wacc =
      cost_of_equity * (1 - capital_structure / 100) +
      (debt_cost * capital_structure) / 100;

    // latest reporting cash flow can be 0!
    // So we look backwards till we find a positive value. If the company
    // has always been losing money, well, no point to compute DCF either,
    // so just set it to 0. If there is a valid number, use that.
    let cash_flow = map(stock.cashes, c => c.operating_cash_flow);
    cash_flow = filter(reverse(cash_flow), x => x > 0);
    if (isEmpty(cash_flow)) {
      cash_flow = 0;
    } else {
      cash_flow = cash_flow[0];
    }

    let income = 0;

    // year 0-5, growing at growth rate
    for (let i = 0; i <= Math.floor(project_year / 2); i++) {
      let tmp = cash_flow * Math.pow(1 + growth_rate / 100, i);
      let discounted = tmp / Math.pow(1 + wacc, i);
      income += discounted;
    }

    // year 6-10, growing at 50% of growth rate
    // Note: here we are assuming
    // - market risk premium is not changing
    // - capital structure is not changing
    // - the cost of debt, eg. rating of this company, is not changing
    //
    // Well, these are a lot to assume!
    for (let i = Math.floor(project_year / 2) + 1; i <= project_year; i++) {
      let tmp = cash_flow * Math.pow(1 + growth_rate / 200, i);
      let discounted = tmp / Math.pow(1 + wacc, i);
      income += discounted;
    }

    // terminal value
    // (FCF * (1 + g)) / (d - g)
    let terminal_value = 0;
    if (wacc > terminal_growth_rate / 100) {
      let terminal = terminal_growth_rate / 100;

      terminal_value = (fcf * (1 + terminal)) / (wacc - terminal);
    }

    // Note: we are assuming no. of stocks dont' change in 10 years!
    let dcf = (income + terminal_value) / stock.shares_outstanding;
    let dcf_last_price = dcf / stock.latest_close_price;
    const dcf_premium_decor = classNames(
      "right",
      dcf_last_price > 1 ? "positive" : "negative"
    );

    const input_mappings = [
      {
        title: "Risk Free",
        value: risk_free,
        min: 0,
        max: 100,
        on_change: this.risk_free_change,
      },
      {
        title: "Project Year",
        value: project_year,
        min: 0,
        max: 100,
        on_change: this.project_year_change,
      },
      {},
    ];

    return (
      <div className="jumbotron">
        DCF Valuation
        <Financials
          title="Close Price"
          data={stock.incomes}
          reported={reported}
        />
        <div className="row">
          <div className="col l4 m6 s12 card">
            <h4 className="mylabel">My Valuation</h4>
            <div className="quotation">
              {dcf.toFixed(2)}
              <span className={dcf_premium_decor}>
                / {dcf_last_price.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="col l4 m6 s12 card">
            <h4 className="mylabel">WACC %</h4>
            <div className="quotation">{(wacc * 100).toFixed(2)}</div>
          </div>
          <div className="col l4 m6 s12 card">
            <h4 className="mylabel">Cost of Equity %</h4>
            <div className="quotation">{(cost_of_equity * 100).toFixed(2)}</div>
          </div>
          <div className="col l4 m6 s12 card">
            <h4 className="mylabel">Today's Cash Flow</h4>
            <div className="quotation">{cash_flow.toFixed(2)}</div>
          </div>
          <div className="col l4 m6 s12 card">
            <h4 className="mylabel">{project_year}-yr Projected CF</h4>
            <div className="quotation">{income.toFixed(2)}</div>
          </div>
          <div className="col l4 m6 s12 card">
            <h4 className="mylabel">Terminal Value</h4>
            <div className="quotation">{terminal_value.toFixed(2)}</div>
          </div>
        </div>
        <div className="row">
          <div className="col l3 m6 s12">
            <h4 className="mylabel">Risk Free Rate</h4>
            <DebounceInput
              className="input-field"
              debounceTimeout={1000}
              value={risk_free}
              type="number"
              min={0}
              onChange={this.risk_free_change}
            />
          </div>
          <div className="col l3 m6 s12">
            <h4 className="mylabel">Project Years</h4>
            <DebounceInput
              className="input-field"
              debounceTimeout={1000}
              value={project_year}
              type="number"
              min={0}
              onChange={this.project_year_change}
            />
          </div>
          <div className="col l3 m6 s12">
            <h4 className="mylabel">Growth Rate %</h4>
            <DebounceInput
              className="input-field"
              debounceTimeout={1000}
              value={growth_rate}
              type="number"
              onChange={this.growth_rate_change}
            />
          </div>
          <div className="col l3 m6 s12">
            <h4 className="mylabel">Ternimal Rate %</h4>
            <DebounceInput
              className="input-field"
              debounceTimeout={1000}
              value={terminal_growth_rate}
              type="number"
              max={(wacc * 100).toFixed(2)}
              onChange={this.terminal_growth_change}
            />
          </div>
          <div className="col l3 m6 s12">
            <h4 className="mylabel">Debt/Asset %</h4>
            <DebounceInput
              className="input-field"
              debounceTimeout={1000}
              value={capital_structure}
              type="number"
              onChange={this.capital_structure_change}
            />
          </div>
          <div className="col l3 m6 s12">
            <h4 className="mylabel">Market Premium %</h4>
            <DebounceInput
              className="input-field"
              debounceTimeout={1000}
              value={market_premium}
              type="number"
              onChange={this.market_premium_change}
            />
          </div>
          <div className="col l3 m6 s12">
            <h4 className="mylabel">Cost of Debt %</h4>
            <DebounceInput
              className="input-field"
              debounceTimeout={1000}
              value={cost_of_debt}
              type="number"
              onChange={this.cost_of_debt_change}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default DCF;
