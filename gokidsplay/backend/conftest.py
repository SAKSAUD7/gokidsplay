import pytest


@pytest.fixture(autouse=True)
def _no_https_redirect(settings):
    """
    CI runs the tests with production settings (DEBUG=False), which turns on
    "redirect every request to HTTPS". The test client talks plain HTTP, so
    switch only that redirect off; every other production setting stays on.
    """
    settings.SECURE_SSL_REDIRECT = False
