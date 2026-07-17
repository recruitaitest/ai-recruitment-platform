from app.models.notification import Notification


def create_notification(
    db,
    user_id,
    title,
    message
):

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message
    )

    db.add(notification)

    db.commit()

    return notification