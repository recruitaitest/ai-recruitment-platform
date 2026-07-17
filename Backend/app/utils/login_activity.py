from app.models.login_activity import LoginActivity


def create_login_activity(
    db,
    user_email,
    role,
    status
):

    activity = LoginActivity(
        user_email=user_email,
        role=role,
        status=status
    )

    db.add(activity)

    db.commit()

    return activity