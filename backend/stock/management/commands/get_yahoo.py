import logging
import os
import re

import yaml
from celery import chain
from celery import group
from django.core.management.base import BaseCommand
from django.http import Http404
from django.shortcuts import get_object_or_404

from stock.models import MyStock
from stock.models import MyStockHistorical
from stock.tasks import balance_sheet_consumer
from stock.tasks import cash_flow_statement_consumer
from stock.tasks import income_statement_consumer
from stock.tasks import summary_consumer
from stock.tasks import valuation_ratio_consumer
from stock.tasks import yahoo_consumer

logger = logging.getLogger("stock")


class Command(BaseCommand):
    help = "Get Yahoo! daily historical data"

    def add_arguments(self, parser):
        parser.add_argument("symbol", help="Stock symbol")

        # Named (optional) arguments
        parser.add_argument(
            "--csv", action="store_true", help="Dump history data to CSV"
        )
        parser.add_argument(
            "--dest", default="./csv", help="Path to put dumped data file"
        )

    def handle(self, *args, **options):
        self.stdout.write(os.path.dirname(__file__), ending="")

        symbol = options["symbol"]

        if options["csv"]:
            dest = options["dest"]
            if symbol == "all":
                for s in MyStock.objects.values_list("symbol", flat=True):
                    self._dump_symbol(dest, s)
            else:
                self._dump_symbol(dest, symbol.strip())
        else:
            if symbol.lower() == "all":
                candidates = []
                with open("config.yml", "r") as f:
                    config = yaml.load(f, Loader=yaml.FullLoader)
                    for sector, symbols in config["symbols"].items():
                        candidates += [
                            (sector, x) for x in re.findall(r"[^,\s]+", symbols)
                        ]
                        # remove symbols if it's not on this list anymore
                        MyStock.objects.exclude(
                            symbol__in=[
                                symbol for (sector, symbol) in candidates
                            ]
                        ).delete()
            else:
                candidates = [("misc", symbol)]

            # now, get info I want
            for (sector, symbol) in candidates:
                history_sig = yahoo_consumer.s(sector, symbol)
                financials_sig = group(
                    income_statement_consumer.s(symbol),
                    cash_flow_statement_consumer.s(symbol),
                    valuation_ratio_consumer.s(symbol),
                    balance_sheet_consumer.s(symbol),
                    summary_consumer.s(symbol),
                )
                task = chain(history_sig, financials_sig)
                task.apply_async()

    def _dump_symbol(self, dest, symbol):
        header = "Date,Open,High,Low,Close,Adj Close,Volume"
        with open("{}/{}.csv".format(dest, symbol), "w") as f:
            data = [header]

            try:
                stock = get_object_or_404(MyStock, symbol=symbol)
            except Http404:
                # something is seriously wrong!
                logger.exception("Symbol {} is not found!".format(symbol))
                return

            historicals = MyStockHistorical.objects.filter(
                stock=stock
            ).order_by("date_stamp")
            for h in historicals:
                data.append(
                    ",".join(
                        map(
                            lambda x: str(x),
                            [
                                h.date_stamp.strftime("%Y-%m-%d"),
                                h.open_price,
                                h.high_price,
                                h.low_price,
                                h.close_price,
                                h.adj_close,
                                # vol is saved in thousands
                                int(h.vol * 1000),
                            ],
                        )
                    )
                )
            f.write("\n".join(data))
