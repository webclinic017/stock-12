import React from "react";
import { Navigate } from "react-router-dom";

import SortIcon from "@material-ui/icons/Sort";
import CompareIcon from "@material-ui/icons/Compare";
import DashboardIcon from "@material-ui/icons/Dashboard";

import MainLayout from "src/layouts/MainLayout";

import NotFoundView from "src/views/errors/NotFoundView";
import StockListView from "src/views/stock/StockListView";
import StockDetailView from "src/views/stock/StockDetailView";
import NavView from "src/views/stock/NavView";
import BalanceView from "src/views/stock/BalanceView";
import IncomeView from "src/views/stock/IncomeView";
import CashFlowView from "src/views/stock/CashFlowView";
import DCFView from "src/views/stock/DCFView";
import ValuationRatiosView from "src/views/stock/ValuationRatiosView";
import StockHistoricalView from "src/views/stock/StockHistoricalView";
import DupontView from "src/views/stock/DupontView";
import PriceView from "src/views/stock/PriceView";
import StockSummaryView from "src/views/stock/StockSummaryView";
import DailyReturnView from "src/views/stock/DailyReturnView";
import OvernightReturnView from "src/views/stock/OvernightReturnView";
import TwentyFourHourReturnView from "src/views/stock/TwentyFourHourReturnView";
import TechIndicatorView from "src/views/stock/TechIndicatorView";
import RankingView from "src/views/stock/RankingView";
import SectorListView from "src/views/sector/SectorListView";
import SectorDetailView from "src/views/sector/SectorDetailView";
import SectorPriceView from "src/views/sector/SectorPriceView";
import SectorReturnView from "src/views/sector/SectorReturnView";
import SectorRoeView from "src/views/sector/SectorRoeView";
import SectorBalancesheetView from "src/views/sector/SectorBalancesheetView";
import SectorIncomeView from "src/views/sector/SectorIncomeView";
import SectorCashFlowView from "src/views/sector/SectorCashFlowView";
import SectorInstitutionOwnershipView from "src/views/sector/SectorInstitutionOwnershipView";
import DiaryListView from "src/views/diary/DiaryListView";
import TodayDashboardView from "src/views/dashboard/TodayDashboardView";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import BusinessIcon from "@material-ui/icons/Business";
import EventNoteIcon from "@material-ui/icons/EventNote";
import NewsListView from "src/views/news/NewsListView";
import DashboardTrendingView from "src/views/dashboard/DashboardTrendingView";
import TrendingUpIcon from "@material-ui/icons/TrendingUp";
import LastLowerNextBetterView from "src/views/stock/LastLowerNextBetterView";
import SectorRoeRankingView from "src/views/sector/SectorRoeRankingView";
import SectorBalanceRankingView from "src/views/sector/SectorBalanceRankingView";
import SectorIncomeRankingView from "src/views/sector/SectorIncomeRankingView";
import SectorCashRankingView from "src/views/sector/SectorCashRankingView";
import SectorValuationRankingView from "src/views/sector/SectorValuationRankingView";
import SectorStocksLowerBetterView from "src/views/sector/SectorStocksLowerBetterView";
import LoginView from "src/views/auth/LoginView";
import LogoutView from "src/views/auth/LogoutView";

const navbar_items = [
  {
    href: "/trending",
    icon: TrendingUpIcon,
    title: "Trending",
  },
  {
    href: "/dashboard",
    icon: DashboardIcon,
    title: "Dashboard",
  },
  {
    href: "/notes",
    icon: EventNoteIcon,
    title: "Notes",
  },
  {
    href: "/rankings",
    icon: SortIcon,
    title: "Rankings",
  },
  {
    href: "/news",
    icon: AnnouncementIcon,
    title: "News",
  },
  {
    href: "/sectors",
    icon: CompareIcon,
    title: "Sectors",
  },
  {
    href: "/stocks",
    icon: BusinessIcon,
    title: "Stocks",
  },
];

const routes = [
  // auth
  { path: "login", element: <LoginView /> },
  { path: "logout", element: <LogoutView /> },

  // application specific
  {
    path: "/",
    element: <MainLayout sideNavs={navbar_items} />,

    children: [
      // stocks
      { path: "stocks", element: <StockListView /> },
      {
        path: "stocks/:id",
        element: <StockDetailView />,
        children: [
          { path: "summary", element: <StockSummaryView /> },
          { path: "nav", element: <NavView /> },
          { path: "balance", element: <BalanceView /> },
          { path: "income", element: <IncomeView /> },
          { path: "cash", element: <CashFlowView /> },
          { path: "dcf", element: <DCFView /> },
          { path: "ratios", element: <ValuationRatiosView /> },
          { path: "dupont", element: <DupontView /> },
          {
            path: "historical",
            element: <StockHistoricalView />,
            children: [
              { path: "price", element: <PriceView /> },
              { path: "return/daily", element: <DailyReturnView /> },
              { path: "return/overnight", element: <OvernightReturnView /> },
              { path: "return/24hr", element: <TwentyFourHourReturnView /> },
              { path: "indicator/:type", element: <TechIndicatorView /> },
              { path: "last/lower", element: <LastLowerNextBetterView /> },
            ],
          },
        ],
      },

      // sectors
      { path: "sectors", element: <SectorListView /> },
      {
        path: "sectors/:id",
        element: <SectorDetailView />,
        children: [
          { path: "price", element: <SectorPriceView /> },
          { path: "return", element: <SectorReturnView /> },
          { path: "dupont", element: <SectorRoeView /> },
          { path: "balance", element: <SectorBalancesheetView /> },
          { path: "income", element: <SectorIncomeView /> },
          { path: "cash", element: <SectorCashFlowView /> },
          { path: "institution", element: <SectorInstitutionOwnershipView /> },
          { path: "ranking/roe", element: <SectorRoeRankingView /> },
          { path: "ranking/balance", element: <SectorBalanceRankingView /> },
          { path: "ranking/income", element: <SectorIncomeRankingView /> },
          { path: "ranking/cash", element: <SectorCashRankingView /> },
          {
            path: "ranking/valuation",
            element: <SectorValuationRankingView />,
          },
          { path: "gains", element: <SectorStocksLowerBetterView /> },
        ],
      },
      { path: "rankings", element: <RankingView /> },
      { path: "notes", element: <DiaryListView /> },
      { path: "dashboard", element: <TodayDashboardView /> },
      { path: "trending", element: <DashboardTrendingView /> },
      {
        path: "news",
        element: <NewsListView />,
      },

      // landing page, default to dashboard
      { path: "/", element: <Navigate to="/dashboard" /> },
      { path: "404", element: <NotFoundView /> },
      // catch all, 404
      { path: "*", element: <Navigate to="/404" /> },
    ],
  },
];

export default routes;
