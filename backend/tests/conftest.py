import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@test.com', password='AdminPass123!', role='admin',
        first_name='Admin', last_name='User',
    )


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(
        email='user@test.com', password='UserPass123!', role='user',
        first_name='Regular', last_name='User',
    )


@pytest.fixture
def admin_token(client, admin_user):
    res = client.post('/api/auth/login/', {
        'email': 'admin@test.com', 'password': 'AdminPass123!',
    }, content_type='application/json')
    return res.json()['access']


@pytest.fixture
def user_token(client, regular_user):
    res = client.post('/api/auth/login/', {
        'email': 'user@test.com', 'password': 'UserPass123!',
    }, content_type='application/json')
    return res.json()['access']


@pytest.fixture
def auth_admin(client, admin_token):
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {admin_token}'
    return client


@pytest.fixture
def auth_user(client, user_token):
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {user_token}'
    return client


@pytest.fixture
def category(db):
    from apps.assets.models import Category
    return Category.objects.create(name='Electronics', description='Electronic equipment')


@pytest.fixture
def asset(db, category, admin_user):
    from apps.assets.models import Asset
    return Asset.objects.create(
        name='Laptop Dell XPS', category=category,
        total_qty=5, available_qty=5,
        status='available', condition='good',
        location='Lab 3', created_by=admin_user,
    )
