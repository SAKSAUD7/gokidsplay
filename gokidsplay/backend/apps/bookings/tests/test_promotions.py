"""Homepage promotions slider (cms Banner): who can change it and what is accepted."""
import pytest
from rest_framework.test import APIClient

from apps.cms.models import Banner
from apps.bookings.tests.test_booking_security import admin_client  # noqa: F401  (fixture)

URL = '/api/v1/cms/banners/'


@pytest.mark.django_db
def test_admin_adds_a_promotion_and_the_public_can_read_it(admin_client):
    response = admin_client.post(URL, {'image_url': '/media/uploads/b2g1.jpg', 'link': '/book', 'title': 'Buy 2 Get 1',
                                       'start_date': '2026-12-01', 'end_date': '2026-12-31'}, format='json')
    assert response.status_code == 201, response.data
    assert APIClient().get(URL).data[0]['link'] == '/book'
    assert APIClient().post(URL, {'image_url': '/media/x.jpg'}, format='json').status_code in (401, 403)


@pytest.mark.django_db
@pytest.mark.parametrize('field, value', [('link', 'javascript:alert(1)'), ('link', '//evil.example'),
                                          ('image_url', 'data:image/png;base64,AAA'), ('image_url', '')])
def test_unsafe_links_and_images_are_refused(admin_client, field, value):
    body = {'image_url': '/media/uploads/promo.jpg', field: value}
    response = admin_client.post(URL, body, format='json')
    assert response.status_code == 400 and field in response.data
    assert not Banner.objects.exists()


@pytest.mark.django_db
def test_end_date_before_start_is_refused(admin_client):
    response = admin_client.post(URL, {'image_url': '/media/p.jpg', 'start_date': '2026-12-10', 'end_date': '2026-12-01'},
                                 format='json')
    assert response.status_code == 400 and 'end_date' in response.data
