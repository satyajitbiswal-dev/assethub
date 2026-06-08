import pytest
from datetime import date, timedelta


def future(days=1):
    return (date.today() + timedelta(days=days)).isoformat()


@pytest.mark.django_db
class TestBookingCreate:
    def test_user_can_create_booking(self, auth_user, asset):
        res = auth_user.post('/api/bookings/', {
            'asset': str(asset.id),
            'quantity': 1,
            'start_date': future(1),
            'end_date': future(5),
            'reason': 'Project work',
        }, content_type='application/json')
        assert res.status_code == 201
        assert res.json()['status'] == 'pending'

    def test_booking_exceeds_available_qty(self, auth_user, asset):
        res = auth_user.post('/api/bookings/', {
            'asset': str(asset.id),
            'quantity': 999,
            'start_date': future(1),
            'end_date': future(5),
        }, content_type='application/json')
        assert res.status_code == 400

    def test_booking_end_before_start(self, auth_user, asset):
        res = auth_user.post('/api/bookings/', {
            'asset': str(asset.id),
            'quantity': 1,
            'start_date': future(5),
            'end_date': future(1),
        }, content_type='application/json')
        assert res.status_code == 400

    def test_booking_past_date_rejected(self, auth_user, asset):
        res = auth_user.post('/api/bookings/', {
            'asset': str(asset.id),
            'quantity': 1,
            'start_date': '2020-01-01',
            'end_date': '2020-01-05',
        }, content_type='application/json')
        assert res.status_code == 400


@pytest.mark.django_db
class TestBookingWorkflow:
    def _create_booking(self, auth_user, asset):
        res = auth_user.post('/api/bookings/', {
            'asset': str(asset.id), 'quantity': 2,
            'start_date': future(1), 'end_date': future(7),
        }, content_type='application/json')
        assert res.status_code == 201
        return res.json()['id']

    def test_approve_booking(self, auth_admin, auth_user, asset):
        bid = self._create_booking(auth_user, asset)
        res = auth_admin.patch(f'/api/bookings/{bid}/approve/')
        assert res.status_code == 200
        assert res.json()['status'] == 'approved'

    def test_reject_booking(self, auth_admin, auth_user, asset):
        bid = self._create_booking(auth_user, asset)
        res = auth_admin.patch(f'/api/bookings/{bid}/reject/',
                               {'reason': 'Not available'}, content_type='application/json')
        assert res.status_code == 200
        assert res.json()['status'] == 'rejected'

    def test_issue_reduces_qty(self, auth_admin, auth_user, asset):
        original_qty = asset.available_qty
        bid = self._create_booking(auth_user, asset)
        auth_admin.patch(f'/api/bookings/{bid}/approve/')
        auth_admin.patch(f'/api/bookings/{bid}/issue/')
        asset.refresh_from_db()
        assert asset.available_qty == original_qty - 2

    def test_return_restores_qty(self, auth_admin, auth_user, asset):
        original_qty = asset.available_qty
        bid = self._create_booking(auth_user, asset)
        auth_admin.patch(f'/api/bookings/{bid}/approve/')
        auth_admin.patch(f'/api/bookings/{bid}/issue/')
        auth_admin.patch(f'/api/bookings/{bid}/return/')
        asset.refresh_from_db()
        assert asset.available_qty == original_qty

    def test_user_can_cancel_pending(self, auth_user, asset):
        bid = self._create_booking(auth_user, asset)
        res = auth_user.patch(f'/api/bookings/{bid}/cancel/')
        assert res.status_code == 200
        assert res.json()['status'] == 'cancelled'

    def test_user_cannot_approve(self, auth_user, asset):
        bid = self._create_booking(auth_user, asset)
        res = auth_user.patch(f'/api/bookings/{bid}/approve/')
        assert res.status_code == 403

    def test_cannot_issue_without_approval(self, auth_admin, auth_user, asset):
        bid = self._create_booking(auth_user, asset)
        res = auth_admin.patch(f'/api/bookings/{bid}/issue/')
        assert res.status_code == 400

    def test_user_only_sees_own_bookings(self, auth_user, auth_admin, asset, regular_user):
        self._create_booking(auth_user, asset)
        res = auth_user.get('/api/bookings/')
        assert res.status_code == 200
        for b in res.json()['results']:
            assert b['user'] == str(regular_user.id)

    def test_admin_sees_all_bookings(self, auth_admin, auth_user, asset):
        self._create_booking(auth_user, asset)
        res = auth_admin.get('/api/bookings/')
        assert res.status_code == 200
        assert res.json()['count'] >= 1


@pytest.mark.django_db
class TestAnalytics:
    def test_summary_admin_only(self, auth_user):
        res = auth_user.get('/api/analytics/summary/')
        assert res.status_code == 403

    def test_summary_returns_data(self, auth_admin):
        res = auth_admin.get('/api/analytics/summary/')
        assert res.status_code == 200
        data = res.json()
        assert 'total_assets' in data
        assert 'utilisation_rate' in data
        assert 'overdue_bookings' in data
