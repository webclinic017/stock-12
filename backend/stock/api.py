import logging
from datetime import date, timedelta

from django.conf.urls import url
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Permission, User
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseForbidden
from django_celery_results.models import TaskResult
from tastypie import fields
from tastypie.authentication import ApiKeyAuthentication
from tastypie.authorization import Authorization, DjangoAuthorization
from tastypie.constants import ALL
from tastypie.exceptions import BadRequest
from tastypie.http import HttpForbidden, HttpUnauthorized
from tastypie.models import ApiKey
from tastypie.resources import ALL_WITH_RELATIONS, Bundle, ModelResource, Resource
from tastypie.utils import trailing_slash

from stock.models import (
    BalanceSheet,
    CashFlow,
    IncomeStatement,
    MyDiary,
    MyNews,
    MySector,
    MyStock,
    MyStockHistorical,
    MyTask,
    ValuationRatio,
)
from stock.tasks import batch_update_helper

logger = logging.getLogger("stock")


class UserResource(ModelResource):
    class Meta:
        object_class = User
        resource_name = "users"
        allowed_methods = ["post"]

        authorization = DjangoAuthorization()

    def obj_create(self, bundle, request=None, **kwargs):
        # sanity check
        username = bundle.data["username"]
        email = bundle.data["email"]
        if User.objects.filter(email=email):
            raise BadRequest("This email address is already used")
        if User.objects.filter(username=username):
            raise BadRequest("This name is already taken")

        # create new user account
        try:
            new_user = User.objects.create_user(
                bundle.data["username"],
                bundle.data["email"],
                bundle.data["password"],
            )
            new_user.first_name = bundle.data["firstName"]
            new_user.last_name = bundle.data["lastName"]
            new_user.save()
        except IntegrityError:
            raise BadRequest(
                "Sorry we can't create an account for you right now."
            )

        bundle.obj = new_user
        return bundle


class AuthResource(Resource):
    class Meta:
        authentication = ApiKeyAuthentication()
        authourization = Authorization()
        allowed_methods = ["get", "post"]
        resource_name = "auth"

    def prepend_urls(self):
        return [
            url(
                r"^(?P<resource_name>%s)/login%s$"
                % (self._meta.resource_name, trailing_slash()),
                self.wrap_view("login"),
                name="api_login",
            ),
            url(
                r"^(?P<resource_name>%s)/logout%s$"
                % (self._meta.resource_name, trailing_slash()),
                self.wrap_view("logout"),
                name="api_logout",
            ),
        ]

    def logout(self, request, **kwargs):
        self.method_check(request, allowed=["get"])

        # MUST: call to populate User
        self.is_authenticated(request)

        if request.user and request.user.is_authenticated:
            logout(request)
            return self.create_response(request, {"success": True})
        else:
            return self.create_response(
                request, {"success": False}, HttpUnauthorized
            )

    def login(self, request, **kwargs):
        self.method_check(request, allowed=["post"])
        data = self.deserialize(
            request,
            request.body,
            format=request.META.get("CONTENT_TYPE", "application/json"),
        )
        username = data.get("username", "")
        password = data.get("password", "")
        user = authenticate(username=username, password=password)
        if user:
            if user.is_active:
                # login(request, user)
                try:
                    key = ApiKey.objects.get(user=user)
                    if not key.key:
                        key.save()
                except ApiKey.DoesNotExist:
                    key = ApiKey.objects.create(user=user)
                return self.create_response(
                    request,
                    {
                        "success": True,
                        "data": {"user": username, "key": key.key},
                    },
                )
            else:
                return self.create_response(
                    request,
                    {
                        "success": False,
                        "message": "User is not active",
                    },
                    HttpForbidden,
                )
        else:
            return self.create_response(
                request,
                {
                    "success": False,
                    "message": "Login failed",
                },
                HttpUnauthorized,
            )


class SectorResource(ModelResource):
    name = fields.CharField("name")
    stocks = fields.ManyToManyField(
        "stock.api.StockResource", "stocks", null=True
    )
    stocks_detail = fields.ManyToManyField(
        "stock.api.StockResource",
        "stocks",
        null=True,
        full=True,
        readonly=True,
        use_in="detail",
    )

    class Meta:
        queryset = MySector.objects.all()
        resource_name = "sectors"
        filtering = {"name": ALL}

        authentication = ApiKeyAuthentication()
        authorization = DjangoAuthorization()

        # MUST: for using PATCH, must include PUT also!!!!
        allowed_methods = ["get", "post", "patch", "delete", "put"]
        limit = 0
        max_limit = 0

    def get_object_list(self, request):
        """Can only see user's sectors"""
        return MySector.objects.filter(user=request.user)

    def obj_create(self, bundle, **kwargs):
        user = bundle.request.user
        sector, created = MySector.objects.get_or_create(
            name=bundle.data["name"], user=user
        )

        bundle.obj = sector
        return bundle

    def obj_update(self, bundle, **kwargs):
        super().obj_update(bundle)

        sector = bundle.obj

        for stock in sector.stocks.all():
            # kick off updates
            batch_update_helper(bundle.request.user, stock.symbol)


class StockResource(ModelResource):
    symbol = fields.CharField("symbol")
    tax_rate = fields.FloatField("tax_rate", null=True, use_in="detail")
    latest_close_price = fields.FloatField(
        "latest_close_price", null=True, use_in="detail"
    )
    dupont_model = fields.ListField("dupont_model", null=True, use_in="detail")
    nav_model = fields.ListField("nav_model", null=True, use_in="detail")
    dupont_roe = fields.FloatField("dupont_roe", null=True, use_in="detail")
    roe_dupont_reported_gap = fields.FloatField(
        "roe_dupont_reported_gap", null=True, use_in="detail"
    )
    last_reporting_date = fields.DateField("last_reporting_date", null=True)
    cross_statements_model = fields.ListField(
        "cross_statements_model", null=True, use_in="detail"
    )

    sectors = fields.ManyToManyField(
        "stock.api.SectorResource", "sectors", null=True
    )
    pe = fields.FloatField("pe", null=True)
    pb = fields.FloatField("pb", null=True)
    ps = fields.FloatField("ps", null=True)
    last_lower = fields.IntegerField("last_lower", null=True)
    last_better = fields.IntegerField("last_better", null=True)
    price_to_cash_premium = fields.FloatField(
        "price_to_cash_premium", null=True
    )

    class Meta:
        queryset = MyStock.objects.all()
        resource_name = "stocks"
        filtering = {"symbol": ALL, "id": ALL}

        authentication = ApiKeyAuthentication()
        authorization = DjangoAuthorization()
        allowed_methods = ["get", "post", "patch", "delete", "put"]
        limit = 0
        max_limit = 0

    def get_object_list(self, request):
        """Can only see user's sectors"""
        user = request.user
        ids = set(
            MyStock.objects.filter(sectors__user=user).values_list(
                "id", flat=True
            )
        )
        return MyStock.objects.filter(id__in=ids)

    def obj_update(self, bundle, **kwargs):
        stock = bundle.obj

        # kick off updates
        batch_update_helper(bundle.request.user, stock.symbol)

    def obj_create(self, bundle, **kwargs):
        user = bundle.request.user

        # new stock is default to be in "misc" sector
        stock, created = MyStock.objects.get_or_create(
            symbol=bundle.data["symbol"]
        )

        if bundle.data["sectors"]:
            # if specified sectors
            for sector in MySector.objects.filter(
                id__in=bundle.data["sectors"], user=user
            ):
                sector.stocks.add(stock)
        else:
            # default to "misc" sector
            misc, whatever = MySector.objects.get_or_create(
                name="demo", user=user
            )
            misc.stocks.add(stock)

        if created:
            # kick off updates
            batch_update_helper(bundle.request.user, stock.symbol)

        bundle.obj = stock
        return bundle


class HistoricalResource(ModelResource):
    stock = fields.ForeignKey("stock.api.StockResource", "stock")
    symbol = fields.CharField("symbol", null=True)
    vol_over_share_outstanding = fields.FloatField(
        "vol_over_share_outstanding", null=True
    )
    stock_id = fields.IntegerField("stock_id", null=True)
    last_lower = fields.IntegerField("last_lower", null=True)
    last_better = fields.IntegerField("last_better", null=True)
    next_better = fields.IntegerField("next_better", null=True)
    gain_probability = fields.FloatField("gain_probability", null=True)

    class Meta:
        authentication = ApiKeyAuthentication()
        allowed_methods = ["get"]
        limit = 0
        max_limit = 0

        resource_name = "historicals"
        queryset = MyStockHistorical.objects.all()
        filtering = {"on": ALL, "stock": ALL}
        ordering = ["on"]

    def get_object_list(self, request):
        """Can only see user's sectors"""

        # all eligible stocks
        user = request.user
        stocks = set(
            MyStock.objects.filter(sectors__user=user).values_list(
                "id", flat=True
            )
        )
        return MyStockHistorical.objects.filter(stock__in=stocks)

    def dehydrate_symbol(self, bundle):
        return bundle.obj.stock.symbol

    def dehydrate_stock_id(self, bundle):
        return bundle.obj.stock.id


class IncomeStatementResource(ModelResource):
    stock = fields.ForeignKey("stock.api.StockResource", "stock")
    symbol = fields.CharField("symbol", null=True)

    # reported
    close_price = fields.FloatField("close_price", null=True)

    # as of pcnt
    net_income_to_revenue = fields.FloatField("net_income_to_revenue")
    gross_profit_to_revenue = fields.FloatField("gross_profit_to_revenue")
    cogs_to_revenue = fields.FloatField("cogs_to_revenue")

    ebit_to_revenue = fields.FloatField("ebit_to_revenue")
    total_expense_to_revenue = fields.FloatField("total_expense_to_revenue")
    operating_income_to_revenue = fields.FloatField(
        "operating_income_to_revenue"
    )
    operating_expense_to_revenue = fields.FloatField(
        "operating_expense_to_revenue"
    )
    selling_ga_to_revenue = fields.FloatField("selling_ga_to_revenue")

    interest_income_to_revenue = fields.FloatField("interest_income_to_revenue")

    other_income_expense_to_revenue = fields.FloatField(
        "other_income_expense_to_revenue"
    )
    pretax_income_to_revenue = fields.FloatField("pretax_income_to_revenue")
    operating_profit = fields.FloatField("operating_profit")
    operating_profit_to_operating_income = fields.FloatField(
        "operating_profit_to_operating_income"
    )
    net_income_to_operating_income = fields.FloatField(
        "net_income_to_operating_income"
    )
    ebit_to_total_asset = fields.FloatField("ebit_to_total_asset")
    net_income_to_equity = fields.FloatField("net_income_to_equity")

    # growth rates
    net_income_growth_rate = fields.FloatField(
        "net_income_growth_rate", null=True
    )
    operating_income_growth_rate = fields.FloatField(
        "operating_income_growth_rate", null=True
    )

    # ratios
    cogs_to_inventory = fields.FloatField("cogs_to_inventory", null=True)
    interest_coverage_ratio = fields.FloatField(
        "interest_coverage_ratio", null=True
    )

    class Meta:
        queryset = IncomeStatement.objects.all()
        resource_name = "incomes"
        filtering = {"stock": ALL_WITH_RELATIONS}
        ordering = ["on"]
        limit = 0
        max_limit = 0

    def dehydrate_symbol(self, bundle):
        return bundle.obj.stock.symbol


class CashFlowResource(ModelResource):
    stock = fields.ForeignKey("stock.api.StockResource", "stock")
    symbol = fields.CharField("symbol", null=True)

    # reported
    close_price = fields.FloatField("close_price", null=True)

    # as of pcnt
    fcf_over_ocf = fields.FloatField("fcf_over_ocf", null=True)
    fcf_over_net_income = fields.FloatField("fcf_over_net_income", null=True)
    ocf_over_net_income = fields.FloatField("ocf_over_net_income", null=True)

    # growth rates
    cash_change_pcnt = fields.FloatField("cash_change_pcnt", null=True)
    operating_cash_flow_growth = fields.FloatField(
        "operating_cash_flow_growth", null=True
    )

    # ratio
    dividend_payout_ratio = fields.FloatField(
        "dividend_payout_ratio", null=True
    )

    class Meta:
        queryset = CashFlow.objects.all()
        resource_name = "cashes"
        filtering = {"stock": ALL_WITH_RELATIONS}
        ordering = ["on"]
        limit = 0
        max_limit = 0

    def dehydrate_symbol(self, bundle):
        return bundle.obj.stock.symbol


class BalanceSheetResource(ModelResource):
    stock = fields.ForeignKey("stock.api.StockResource", "stock")
    symbol = fields.CharField("symbol", null=True)

    # reported
    close_price = fields.FloatField("close_price", null=True)

    # ratio
    current_ratio = fields.FloatField("current_ratio", null=True)
    quick_ratio = fields.FloatField("quick_ratio", null=True)
    debt_to_equity_ratio = fields.FloatField("debt_to_equity_ratio", null=True)
    capital_structure = fields.FloatField("capital_structure", null=True)
    equity_multiplier = fields.FloatField("equity_multiplier", null=True)

    # as of pcnt
    liability_to_asset = fields.FloatField("liability_to_asset", null=True)
    current_asset_to_total_asset = fields.FloatField(
        "current_asset_to_total_asset", null=True
    )
    working_capital_to_current_liabilities = fields.FloatField(
        "working_capital_to_current_liabilities", null=True
    )
    non_current_to_equity = fields.FloatField(
        "non_current_to_equity", null=True
    )
    retained_earnings_to_equity = fields.FloatField(
        "retained_earnings_to_equity", null=True
    )
    inventory_to_current_asset = fields.FloatField(
        "inventory_to_current_asset", null=True
    )
    cash_cash_equivalents_and_short_term_investments_to_current_asset = (
        fields.FloatField(
            "cash_cash_equivalents_and_short_term_investments_to_current_asset",
            null=True,
        )
    )

    # growth rates
    equity_growth_rate = fields.FloatField("equity_growth_rate", null=True)
    debt_growth_rate = fields.FloatField("debt_growth_rate", null=True)
    ap_growth_rate = fields.FloatField("ap_growth_rate", null=True)
    ar_growth_rate = fields.FloatField("ar_growth_rate", null=True)
    all_cash_growth_rate = fields.FloatField("all_cash_growth_rate", null=True)
    working_capital_growth_rate = fields.FloatField(
        "working_capital_growth_rate", null=True
    )
    invested_capital_growth_rate = fields.FloatField(
        "invested_capital_growth_rate", null=True
    )
    net_ppe_growth_rate = fields.FloatField("net_ppe_growth_rate", null=True)
    share_issued_growth_rate = fields.FloatField(
        "share_issued_growth_rate", null=True
    )

    # computed values
    total_liability = fields.FloatField("total_liability", null=True)
    tangible_book_value_per_share = fields.FloatField(
        "tangible_book_value_per_share", null=True
    )
    cash_and_cash_equivalent_per_share = fields.FloatField(
        "cash_and_cash_equivalent_per_share", null=True
    )
    price_to_cash_premium = fields.FloatField(
        "price_to_cash_premium", null=True
    )

    class Meta:
        queryset = BalanceSheet.objects.all()
        resource_name = "balances"
        filtering = {"stock": ALL_WITH_RELATIONS}
        ordering = ["on"]
        limit = 0
        max_limit = 0

    def dehydrate_symbol(self, bundle):
        return bundle.obj.stock.symbol


class ValuationRatioResource(ModelResource):
    stock = fields.ForeignKey("stock.api.StockResource", "stock")
    symbol = fields.CharField("symbol", null=True)

    class Meta:
        queryset = ValuationRatio.objects.all()
        resource_name = "ratios"
        filtering = {"stock": ALL_WITH_RELATIONS}
        ordering = ["on"]

    def dehydrate_symbol(self, bundle):
        return bundle.obj.stock.symbol


class StatSummary:
    def __init__(self, id=None, name=None, stats=None):
        self.id = id
        self.name = name
        self.stats = stats


class RankingResource(Resource):
    id = fields.IntegerField("id")
    name = fields.CharField("name", null=True)
    stats = fields.ListField("stats")

    class Meta:
        abstract = True
        authentication = ApiKeyAuthentication()
        allowed_methods = ["get"]

        object_class = StatSummary
        filtering = {"stats": ALL, "symbol": ALL}

    def build_filters(self, filters=None, **kwargs):
        if filters is None:
            filters = {}

        orm_filters = filters

        if "stats__in" in filters:
            orm_filters["id__in"] = filters["stats__in"]
        if "symbol__in" in filters:
            orm_filters["symbol__in"] = filters["symbol__in"]

        return orm_filters

    def apply_filters(self, request, applicable_filters):
        """
        Apply the filters
        """
        obj_list = self.get_object_list(request)
        if "id__in" in applicable_filters:
            ids = list(map(int, applicable_filters["id__in"].split(",")))
            for o in obj_list:
                o.stats = list(filter(lambda x: x["id"] in ids, o.stats))

        if "symbol__in" in applicable_filters:
            symbols = [
                x.upper() for x in applicable_filters["symbol__in"].split(",")
            ]
            for o in obj_list:
                o.stats = list(
                    filter(lambda x: x["symbol"] in symbols, o.stats)
                )

        return obj_list

    def obj_get_list(self, bundle, **kwargs):
        # outer get of object list... this calls get_object_list and
        # could be a point at which additional filtering may be applied

        request = bundle.request
        if hasattr(request, "GET"):
            # Grab a mutable copy.
            filters = request.GET.copy()

        applicable_filters = self.build_filters(filters)
        return self.apply_filters(request, applicable_filters)

    # The following methods will need overriding regardless of your
    # data source.
    def detail_uri_kwargs(self, bundle_or_obj):
        kwargs = {}

        if isinstance(bundle_or_obj, Bundle):
            kwargs["pk"] = bundle_or_obj.obj.id
        else:
            kwargs["pk"] = bundle_or_obj.id

        return kwargs

    def _get_object_list_helper(self, objects, sort_by, high_to_low):
        """Helper to build a list.

        Args
        ----
          :param: objects, Queryset or ModelManager

          This represents the overall data set I'm going to work w/,
          eg. MyStock.objects.

          :param: sort_by, str

          Should be a model field name so we can sort the queryset by
          it.

          :param: high_to_low, bool

          True if we are to sort the values high to low. False will be
          low to high.

        Return
        ------
          list: [{}]

          Return value will be a list of the following dict:
          {
            "id": stock id,
            "symbol": stock symbol,
            "on": the date when these values were originated,
            "val": the value,
          }

        """

        # Hardcode to limit data set to be within the last 180 days.
        start = date.today() - timedelta(days=180)

        # Get the data based on time range and sort them.
        valid_entries = list(
            filter(
                lambda x: getattr(x, sort_by) and getattr(x, sort_by) != -100,
                objects.filter(on__gte=start),
            )
        )
        data_set = sorted(
            valid_entries,
            key=lambda x: getattr(x, sort_by),
            reverse=high_to_low,
        )

        # result
        vals = []

        # remember symbol I have counted because I only want to count
        # a symbol once.
        counted = []
        for x in data_set:
            symbol = x.stock.symbol
            if symbol in counted:
                continue
            vals.append(
                {
                    "id": x.stock.id,
                    "symbol": symbol,
                    "on": x.on,
                    "val": getattr(x, sort_by),
                }
            )

            # keep tracking which symbol I have counted
            counted.append(symbol)

        return vals

    def _get_ranks(self, request, objs, attrs):
        """
        Args
        ----

          :attrs: list[(id, attr, name)]

          - id: int, unique within this list, used as REST resource id.
          - attr: str, attribute name of the object.
          - name: str, name of the resource

        Return
        ------

          list[StatSummary]
        """

        # ASSUMPTION: all models have a foreign key to MyStock
        user_viewable_objs = objs.filter(stock__sectors__user=request.user)

        ranks = []
        for (id, attr, high_to_low) in attrs:
            vals = self._get_object_list_helper(
                user_viewable_objs, attr, high_to_low
            )
            ranks.append(StatSummary(id, attr, vals))
        return ranks


class RankStockResource(RankingResource):
    """Ranking by values of MyStock model."""

    class Meta(RankingResource.Meta):
        resource_name = "stock-ranks"

    def get_object_list(self, request):
        attrs = [
            ("roe", True),
            ("dupont_roe", True),
            ("roe_dupont_reported_gap", False),
        ]

        attrs = [
            (index, name, high_to_low)
            for index, (name, high_to_low) in enumerate(attrs)
        ]

        objects = MyStock.objects.filter(sectors__user=request.user)
        return [
            StatSummary(index, attr, self._rank_by(objects, attr, high_to_low))
            for (index, attr, high_to_low) in attrs
        ]

    def _rank_by(self, objs, attr, high_to_low):
        vals = []

        for s in objs:
            vals.append(
                {"id": s.id, "symbol": s.symbol, "val": getattr(s, attr)}
            )

        # WARNING: eliminate 0 and -100, which are _invalid_ or
        # _unknown_ internally becase some data anomalies.
        valid_entries = list(
            filter(lambda x: x["val"] and x["val"] != -100, vals)
        )

        # sort is low->high by default, high-to-low will be a reverse.
        data_set = sorted(
            valid_entries, key=lambda x: x["val"], reverse=high_to_low
        )

        return data_set


class RankBalanceResource(RankingResource):
    """Ranking by values of BalanceSheet model."""

    class Meta(RankingResource.Meta):
        resource_name = "balance-ranks"

    def get_object_list(self, request):
        attrs = [
            # ratio
            ("current_ratio", True),
            ("quick_ratio", True),
            ("debt_to_equity_ratio", False),
            ("equity_multiplier", False),
            ("price_to_cash_premium", False),
            # growth rate
            ("equity_growth_rate", True),
            ("debt_growth_rate", False),
            ("ap_growth_rate", False),
            ("ar_growth_rate", False),
            ("all_cash_growth_rate", True),
            ("working_capital_growth_rate", False),
            ("invested_capital_growth_rate", False),
            ("share_issued_growth_rate", False),
            # pcnt
            (
                "cash_cash_equivalents_and_short_term_investments_to_current_asset",
                True,
            ),
            ("liability_to_asset", False),
            ("non_current_to_equity", True),
            ("retained_earnings_to_equity", True),
            ("inventory_to_current_asset", False),
            ("working_capital_to_current_liabilities", True),
        ]
        attrs = [
            (index, name, high_to_low)
            for index, (name, high_to_low) in enumerate(attrs)
        ]
        return self._get_ranks(request, BalanceSheet.objects, attrs)


class RankCashFlowResource(RankingResource):
    """Ranking by values of CashFlow model."""

    class Meta(RankingResource.Meta):
        resource_name = "cash-ranks"

    def get_object_list(self, request):
        attrs = [
            # ratio
            ("dividend_payout_ratio", True),
            # growth
            ("operating_cash_flow_growth", True),
            # pcnt
            ("cash_change_pcnt", True),
            ("fcf_over_ocf", True),
            ("fcf_over_net_income", True),
            ("ocf_over_net_income", True),
        ]
        attrs = [
            (index, name, high_to_low)
            for index, (name, high_to_low) in enumerate(attrs)
        ]
        return self._get_ranks(request, CashFlow.objects, attrs)


class RankIncomeResource(RankingResource):
    """Ranking by values of IncomeStatement model."""

    class Meta(RankingResource.Meta):
        resource_name = "income-ranks"

    def get_object_list(self, request):
        attrs = [
            # growth rate
            ("net_income_growth_rate", True),
            ("operating_income_growth_rate", True),
            # pcnt
            ("gross_profit_to_revenue", True),
            ("net_income_to_revenue", True),
            ("operating_profit_to_operating_income", True),
            ("net_income_to_operating_income", True),
            ("pretax_income_to_revenue", True),
            ("cogs_to_revenue", False),
            ("ebit_to_revenue", True),
            ("total_expense_to_revenue", False),
            ("operating_income_to_revenue", True),
            ("operating_expense_to_revenue", False),
            ("selling_ga_to_revenue", False),
            ("interest_income_to_revenue", False),
            ("other_income_expense_to_revenue", False),
            ("ebit_to_total_asset", True),
            ("net_income_to_equity", True),
            # ratio
            ("cogs_to_inventory", True),
            ("interest_coverage_ratio", True),
        ]

        attrs = [
            (index, name, high_to_low)
            for index, (name, high_to_low) in enumerate(attrs)
        ]
        return self._get_ranks(request, IncomeStatement.objects, attrs)


class RankValuationRatioResource(RankingResource):
    """Ranking by values of ValuationRatio model."""

    class Meta(RankingResource.Meta):
        resource_name = "valuation-ranks"

    def get_object_list(self, request):
        attrs = [("pe", False), ("pb", False), ("ps", False)]
        attrs = [
            (index, name, high_to_low)
            for index, (name, high_to_low) in enumerate(attrs)
        ]
        return self._get_ranks(request, ValuationRatio.objects, attrs)


class DiaryResource(ModelResource):

    created = fields.DateTimeField("created", readonly=True)
    stock = fields.ForeignKey("stock.api.StockResource", "stock", null=True)
    price = fields.FloatField("price", null=True, readonly=True)
    is_correct = fields.BooleanField("is_correct", null=True, readonly=True)
    content = fields.CharField("content", use_in="detail")

    class Meta:
        queryset = MyDiary.objects.all().order_by("-created")
        resource_name = "diaries"
        filtering = {
            "stock": ALL,
            "last_updated": ["range"],
            "content": ["contains"],
        }

        authentication = ApiKeyAuthentication()
        allowed_methods = ["get", "post", "patch", "delete"]
        authorization = DjangoAuthorization()

    def get_object_list(self, request):
        """Can only see user's diaries"""
        user = request.user
        return MyDiary.objects.filter(user=user).order_by("-last_updated")

    def obj_create(self, bundle, **kwargs):
        user = bundle.request.user

        stock = MyStock.objects.filter(id=bundle.data["stock"]).first()
        if stock and stock.symbol not in bundle.data["content"]:
            content = bundle.data["content"]+f"\n- {stock.symbol}\n"
        else:
            content = bundle.data["content"]

        diary = MyDiary(
            user=user,
            stock=stock,
            content=content,
            judgement=bundle.data["judgement"],
        )
        diary.save()
        bundle.obj = diary
        return bundle


class NewsResource(ModelResource):
    class Meta:
        queryset = MyNews.objects.all().order_by("-pub_time")
        resource_name = "news"
        filtering = {
            "title": ALL,
            "topic": ALL,
            "summary": ALL,
            "pub_time": ALL,
        }


class TaskResource(ModelResource):
    stocks = fields.ManyToManyField(
        "stock.api.StockResource",
        "stocks",
        null=True,
        full=True,
        readonly=True,
    )
    result = fields.OneToOneField(
        "stock.api.TaskResultResource",
        "result",
        null=True,
        full=True,
        readonly=True,
    )

    class Meta:
        queryset = MyTask.objects.all()
        resource_name = "tasks"
        filtering = {"state": ALL, "stocks": ALL_WITH_RELATIONS}

        authentication = ApiKeyAuthentication()
        authorization = DjangoAuthorization()
        allowed_methods = ["get", "delete"]

    def get_object_list(self, request):
        """Can only see user's tasks"""
        user = request.user
        return MyTask.objects.filter(user=user)

    def dehydrate_stocks(self, bundle):
        stocks = bundle.obj.stocks.all()
        return [{"id": x.id, "symbol": x.symbol} for x in stocks]


class TaskResultResource(ModelResource):
    class Meta:
        queryset = TaskResult.objects.all()
        resource_name = "task-results"
        filtering = {
            "task_id": ALL,
        }

        authentication = ApiKeyAuthentication()
        allowed_methods = ["get"]
