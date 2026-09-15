from django.db import migrations


def seed_event(apps, schema_editor):
    apps.get_model("competition", "Event").objects.get_or_create(pk=1)


class Migration(migrations.Migration):
    dependencies = [("competition", "0001_initial")]
    operations = [migrations.RunPython(seed_event, migrations.RunPython.noop)]
