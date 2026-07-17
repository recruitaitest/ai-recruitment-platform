from abc import ABC, abstractmethod


class BaseMailProvider(ABC):

    @abstractmethod
    def connect(self):
        pass

    @abstractmethod
    def disconnect(self, db):
        pass

    @abstractmethod
    def sync_messages(self, db):
        pass

    @abstractmethod
    def get_messages(self, db):
        pass

    @abstractmethod
    def get_message(self, db, message_id):
        pass

    @abstractmethod
    def download_attachment(self, db, account, message_id, attachment_id):
        pass

    @abstractmethod
    def send_email(self, to, subject, body, attachments=None):
        pass

    @abstractmethod
    def oauth_callback(self, db, code, state):
        pass

    @abstractmethod
    def mailbox_stats(self, db):
        pass

    @abstractmethod
    def get_accounts(self, db):
        pass