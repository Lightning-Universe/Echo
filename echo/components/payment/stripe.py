import os
from dataclasses import dataclass
from datetime import date, datetime
from typing import Callable, List

import stripe
from fastapi import Header, Request, Response
from fastapi.responses import RedirectResponse
from lightning import LightningFlow
from lightning.app.api import Get, Post
from lightning.app.utilities.app_helpers import Logger
from stripe.error import SignatureVerificationError

logger = Logger(__name__)

create_checkout_session_path = "/_stripe/create-checkout-session"
stripe_events_path = "/_stripe/stripe-events"


DEFAULT_UNIT_PRICE = 100


@dataclass
class Order:
    """Order represents a single order from a customer."""

    id: str
    customer_email: str
    created_at: date


class Stripe(LightningFlow):
    """Stripe is a `LightningFlow` that provides payment processing using Stripe Checkout."""

    def __init__(
        self,
        api_key: str,
        product_name: str,
        product_description: str = "",
        product_images: List[str] = [],
        # TODO(alecmerdler): Determine if `determine_price` or `determine_quantity` makes a better API...
        unit_price=DEFAULT_UNIT_PRICE,
        determine_price: Callable[[str], int] = None,
        determine_quantity: Callable[[str], int] = None,
        on_checkout_completed: Callable[[Order], None] = None,
        success_url: str = None,
        cancel_url: str = None,
    ):
        super().__init__()

        if determine_price is None and determine_quantity is None:
            raise ValueError("Must provide either a `determine_price` or `determine_quantity` function.")
        if on_checkout_completed is None:
            raise ValueError("Must provide an `on_checkout_completed` function.")

        stripe.api_key = api_key

        self.app_url = os.environ.get("LIGHTNING_APP_EXTERNAL_URL", "http://localhost:7501")
        self.success_url = success_url or f"{self.app_url}?success=true"
        self.cancel_url = cancel_url or f"{self.app_url}?canceled=true"

        self.create_checkout_session_url = self.app_url + create_checkout_session_path
        self.product_name = product_name
        self.product_description = product_description
        self.product_images = product_images
        self.unit_price = unit_price

        # These will be created dynamically using the Stripe API at runtime
        self._endpoint_secret = os.environ.get("DEVELOPMENT_STRIPE_WEBHOOK_SECRET", None)
        self._product = None
        self._price = None
        self._on_checkout_completed = on_checkout_completed
        self._determine_price = determine_price
        self._determine_quantity = determine_quantity

    def handle_create_checkout_session(self, id: str):
        # TODO(alecmerdler): Determine if `determine_price` or `determine_quantity` makes a better API...
        price = self.unit_price
        # price = self._determine_price(id)
        quantity = self._determine_quantity(id)

        try:
            checkout_session = stripe.checkout.Session.create(
                line_items=[
                    {
                        "quantity": quantity,
                        "price_data": {
                            "currency": "usd",
                            "product": self._product["id"],
                            "unit_amount": price,
                        },
                    },
                ],
                metadata={
                    "order_id": id,
                },
                mode="payment",
                success_url=self.success_url,
                cancel_url=self.cancel_url,
            )
        except Exception as e:
            logger.error(e)

            return Response(status_code=500)

        return RedirectResponse(checkout_session.url, status_code=303)

    def handle_stripe_events(self, request: Request, stripe_signature: str = Header(None)):
        event = None
        payload = request._body

        try:
            event = stripe.Webhook.construct_event(payload, stripe_signature, self._endpoint_secret)
        except ValueError as e:
            logger.error(e)

            return Response(status_code=400)
        except SignatureVerificationError as e:
            logger.error(e)

            return Response(status_code=400)

        if event["type"] == "checkout.session.completed":
            session = stripe.checkout.Session.retrieve(
                event["data"]["object"]["id"],
                expand=["line_items"],
            )

            order = Order(
                id=session["metadata"]["order_id"],
                customer_email=session["customer_details"]["email"],
                created_at=datetime.fromtimestamp(session["created"]),
            )

            logger.debug("Received order from Stripe: " + str(order))

            self._on_checkout_completed(order)

        return None

    def configure_api(self):
        return [
            Get(create_checkout_session_path, self.handle_create_checkout_session),
            Post(stripe_events_path, self.handle_stripe_events),
        ]

    def create_product(self):
        products = stripe.Product.list()
        for product in products["data"]:
            if product["name"] == self.product_name:
                return product

        logger.info("Creating new Product in Stripe: " + self.product_name)

        return stripe.Product.create(
            name=self.product_name,
            description=self.product_description,
            images=self.product_images,
        )

    def create_webhook_endpoint(self):
        endpoints = stripe.WebhookEndpoint.list()
        for endpoint in endpoints["data"]:
            if endpoint["url"] == self.app_url + stripe_events_path:
                # NOTE: We have to recreate the webhook because you can only fetch the secret from the API at creation.
                logger.info("Deleting existing Webhook Endpoint in Stripe: " + self.app_url)

                stripe.WebhookEndpoint.delete(endpoint["id"])

        if self.app_url == "http://localhost:7501":
            logger.error(
                "Cannot create Webhook Endpoint in Stripe for local development. Use `stripe listen` command instead."
            )

            return None

        logger.info("Creating new Webhook Endpoint in Stripe: " + self.app_url)

        return stripe.WebhookEndpoint.create(
            url=f"{self.app_url}/_stripe/stripe-events", enabled_events=["checkout.session.completed"]
        )

    def run(self):
        self._product = self.create_product()

        if self._endpoint_secret is None:
            endpoint = self.create_webhook_endpoint()
            self._endpoint_secret = endpoint["secret"]
