import pytest


@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Each test starts with fresh rate-limit counters (the suite makes many requests from one IP)."""
    from django.core.cache import cache
    cache.clear()
    yield
