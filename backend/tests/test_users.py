import pytest
from django.urls import reverse


@pytest.mark.django_db
class TestRegister:
    def test_register_success(self, client):
        res = client.post(reverse('auth-register'), {
            'email': 'test@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
            'first_name': 'Test',
        }, content_type='application/json')
        assert res.status_code == 201
        assert res.json()['success'] is True

    def test_register_duplicate_email(self, client, django_user_model):
        django_user_model.objects.create_user(email='dup@example.com', password='pass')
        res = client.post(reverse('auth-register'), {
            'email': 'dup@example.com',
            'password': 'StrongPass123!',
            'password2': 'StrongPass123!',
        }, content_type='application/json')
        assert res.status_code == 400

    def test_register_password_mismatch(self, client):
        res = client.post(reverse('auth-register'), {
            'email': 'new@example.com',
            'password': 'StrongPass123!',
            'password2': 'WrongPass456!',
        }, content_type='application/json')
        assert res.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, client, django_user_model):
        django_user_model.objects.create_user(email='login@example.com', password='TestPass123!')
        res = client.post(reverse('auth-login'), {
            'email': 'login@example.com',
            'password': 'TestPass123!',
        }, content_type='application/json')
        assert res.status_code == 200
        data = res.json()
        assert 'access' in data
        assert 'refresh' in data
        assert data['user']['email'] == 'login@example.com'

    def test_login_wrong_password(self, client, django_user_model):
        django_user_model.objects.create_user(email='x@example.com', password='correct')
        res = client.post(reverse('auth-login'), {
            'email': 'x@example.com', 'password': 'wrong',
        }, content_type='application/json')
        assert res.status_code == 401
