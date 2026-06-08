import pytest


@pytest.mark.django_db
class TestAssetCRUD:
    def test_list_assets_authenticated(self, auth_user, asset):
        res = auth_user.get('/api/assets/')
        assert res.status_code == 200
        assert res.json()['count'] >= 1

    def test_list_assets_unauthenticated(self, client):
        res = client.get('/api/assets/')
        assert res.status_code == 401

    def test_create_asset_as_admin(self, auth_admin, category):
        res = auth_admin.post('/api/assets/', {
            'name': 'Projector', 'category': str(category.id),
            'total_qty': 3, 'status': 'available', 'condition': 'good',
        }, content_type='application/json')
        assert res.status_code == 201
        assert res.json()['available_qty'] == 3

    def test_create_asset_as_user_forbidden(self, auth_user, category):
        res = auth_user.post('/api/assets/', {
            'name': 'Sneaky Asset', 'category': str(category.id), 'total_qty': 1,
        }, content_type='application/json')
        assert res.status_code == 403

    def test_get_asset_detail(self, auth_user, asset):
        res = auth_user.get(f'/api/assets/{asset.id}/')
        assert res.status_code == 200
        assert res.json()['name'] == asset.name

    def test_search_asset(self, auth_user, asset):
        res = auth_user.get('/api/assets/?search=Laptop')
        assert res.status_code == 200
        assert res.json()['count'] >= 1

    def test_filter_by_status(self, auth_user, asset):
        res = auth_user.get('/api/assets/?status=available')
        assert res.status_code == 200
        for a in res.json()['results']:
            assert a['status'] == 'available'

    def test_qr_code_returns_image(self, auth_user, asset):
        res = auth_user.get(f'/api/assets/{asset.id}/qr/')
        assert res.status_code == 200
        assert res['Content-Type'] == 'image/png'
