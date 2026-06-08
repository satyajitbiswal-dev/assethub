"""
Management command to seed demo data.
Usage: python manage.py seed
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from datetime import date, timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with demo data (categories, assets, users, bookings)'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Seeding demo data...')
        self._seed_users()
        self._seed_assets()
        self._seed_bookings()
        self.stdout.write(self.style.SUCCESS('✅ Seed complete!'))

    def _seed_users(self):
        from apps.assets.models import Category, Asset
        # Admin
        if not User.objects.filter(email='admin@demo.com').exists():
            User.objects.create_superuser(
                email='admin@demo.com', password='Admin@123',
                first_name='Admin', last_name='Demo',
                role='admin', department='IT',
            )
            self.stdout.write('  Created admin@demo.com  /  Admin@123')

        # Regular users
        users_data = [
            ('alice@demo.com', 'Alice', 'Sharma', 'Engineering'),
            ('bob@demo.com',   'Bob',   'Verma',  'Design'),
            ('carol@demo.com', 'Carol', 'Singh',  'Marketing'),
        ]
        for email, first, last, dept in users_data:
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    email=email, password='User@123',
                    first_name=first, last_name=last, department=dept,
                )
        self.stdout.write('  Created 3 regular users  (password: User@123)')

    def _seed_assets(self):
        from apps.assets.models import Category, Asset
        admin = User.objects.get(email='admin@demo.com')

        categories = [
            ('Electronics',  'Laptops, cameras, peripherals'),
            ('Furniture',    'Chairs, tables, whiteboards'),
            ('Lab Equipment','Instruments and scientific tools'),
            ('AV Equipment', 'Projectors, screens, speakers'),
            ('Vehicles',     'Campus transport and bikes'),
        ]
        cat_objs = {}
        for name, desc in categories:
            cat, _ = Category.objects.get_or_create(name=name, defaults={'description': desc})
            cat_objs[name] = cat

        assets_data = [
            ('MacBook Pro 14"',      'Electronics',   10, 'Lab 1',    'good'),
            ('Dell XPS 15',          'Electronics',    8, 'Lab 1',    'good'),
            ('iPad Pro 12.9"',       'Electronics',    6, 'Lab 2',    'fair'),
            ('Canon EOS R5 Camera',  'Electronics',    3, 'Studio',   'good'),
            ('Standing Desk',        'Furniture',     15, 'Floor 2',  'good'),
            ('Ergonomic Chair',      'Furniture',     20, 'Floor 2',  'good'),
            ('Whiteboard 6ft',       'Furniture',      5, 'Conf Rm',  'good'),
            ('Oscilloscope',         'Lab Equipment',  4, 'Lab 3',    'good'),
            ('Soldering Station',    'Lab Equipment',  6, 'Lab 3',    'fair'),
            ('3D Printer',           'Lab Equipment',  2, 'Lab 4',    'good'),
            ('Epson Projector 4K',   'AV Equipment',   8, 'Conf Rm',  'good'),
            ('Bose Speaker System',  'AV Equipment',   4, 'Auditorium','good'),
            ('HDMI Switcher',        'AV Equipment',  10, 'AV Room',  'good'),
            ('Campus E-Bike',        'Vehicles',       5, 'Parking',  'good'),
            ('Golf Cart',            'Vehicles',       2, 'Parking',  'fair'),
        ]

        for name, cat_name, qty, loc, cond in assets_data:
            if not Asset.objects.filter(name=name).exists():
                Asset.objects.create(
                    name=name, category=cat_objs[cat_name],
                    total_qty=qty, available_qty=qty,
                    status='available', condition=cond,
                    location=loc, created_by=admin,
                )
        self.stdout.write(f'  Created {len(assets_data)} assets across 5 categories')

    def _seed_bookings(self):
        from apps.assets.models import Asset
        from apps.bookings.models import Booking
        from django.utils import timezone

        if Booking.objects.exists():
            self.stdout.write('  Bookings already exist, skipping.')
            return

        users = list(User.objects.filter(role='user'))
        assets = list(Asset.objects.filter(status='available')[:6])
        if not users or not assets:
            return

        today = date.today()
        bookings_data = [
            (users[0], assets[0], 1, today + timedelta(1),  today + timedelta(7),  'pending',  'Research project'),
            (users[0], assets[2], 2, today + timedelta(2),  today + timedelta(4),  'approved', 'Workshop'),
            (users[1], assets[1], 1, today - timedelta(3),  today + timedelta(4),  'issued',   'Client presentation'),
            (users[1], assets[3], 1, today - timedelta(10), today - timedelta(3),  'issued',   'Event photography'),  # overdue
            (users[2], assets[4], 1, today - timedelta(7),  today - timedelta(2),  'returned', 'Team standup'),
            (users[0], assets[5], 1, today + timedelta(5),  today + timedelta(10), 'pending',  'Demo day'),
        ]

        admin = User.objects.get(email='admin@demo.com')
        for user, asset, qty, start, end, status, reason in bookings_data:
            b = Booking.objects.create(
                user=user, asset=asset, quantity=qty,
                start_date=start, end_date=end,
                status=status, reason=reason,
            )
            if status in ('approved', 'issued', 'returned'):
                b.reviewed_by = admin
                b.reviewed_at = timezone.now()
            if status in ('issued', 'returned'):
                asset.available_qty = max(0, asset.available_qty - qty)
                asset.save()
                b.issued_at = timezone.now()
            if status == 'returned':
                asset.available_qty += qty
                asset.save()
                b.returned_at = timezone.now()
            b.save()

        self.stdout.write(f'  Created {len(bookings_data)} bookings (1 overdue for demo)')
