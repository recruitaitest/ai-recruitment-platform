from .base import BaseMailProvider


class OutlookProvider(BaseMailProvider):

    def connect(self):
        raise NotImplementedError

    def oauth_callback(self, code, state):
        raise NotImplementedError

    def disconnect(self):
        raise NotImplementedError

    def sync_messages(self):
        raise NotImplementedError

    def get_messages(self):
        raise NotImplementedError

    def get_message(self, message_id):
        raise NotImplementedError

    def download_attachment(self, message_id, attachment_id):
        raise NotImplementedError

    def send_email(self, to, subject, body, attachments=None):
        raise NotImplementedError