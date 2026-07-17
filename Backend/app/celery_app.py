import os
from celery import Celery

# Assuming Redis is running on localhost
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

from celery.schedules import crontab

celery_app = Celery(
    "ai_resume_platform",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.resume_tasks", "app.tasks.mailbox_tasks", "app.tasks.maintenance_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_pool="solo"
)

celery_app.conf.beat_schedule = {
    "enforce-data-retention-daily": {
        "task": "app.tasks.maintenance_tasks.enforce_data_retention_policy",
        "schedule": crontab(hour=0, minute=0),  # Run daily at midnight
    }
}
