import os
from dotenv import load_dotenv

# Load environment variables for local celery worker
load_dotenv()

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
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=None,  # Automatically reconnect if Redis restarts or drops
    broker_transport_options={
        "visibility_timeout": 3600,
        "retry_on_timeout": True,
        "socket_keepalive": True,
        "socket_timeout": 30,
        "socket_connect_timeout": 30,
        "health_check_interval": 15,
    },
    result_backend_transport_options={
        "retry_on_timeout": True,
        "socket_keepalive": True,
    },
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
