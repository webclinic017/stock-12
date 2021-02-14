# Generated by Django 3.1.6 on 2021-02-14 22:30

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('stock', '0014_auto_20210214_1901'),
    ]

    operations = [
        migrations.CreateModel(
            name='ValuationRatio',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('on', models.DateField(blank=True, null=True)),
                ('forward_pe', models.FloatField(blank=True, default=0, null=True)),
                ('pe', models.FloatField(blank=True, default=0, null=True)),
                ('pb', models.FloatField(blank=True, default=0, null=True)),
                ('peg', models.FloatField(blank=True, default=0, null=True)),
                ('ps', models.FloatField(blank=True, default=0, null=True)),
                ('stock', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ratios', to='stock.mystock')),
            ],
        ),
    ]
