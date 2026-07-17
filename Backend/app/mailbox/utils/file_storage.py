import os
import uuid
import boto3
from pathlib import Path

UPLOAD_DIR = Path("uploads/mailbox")

UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION"),
        endpoint_url=os.getenv("AWS_ENDPOINT_URL")
    )

def generate_unique_filename(filename: str) -> str:
    extension = Path(filename).suffix
    unique_name = f"{uuid.uuid4()}{extension}"
    return unique_name

def save_attachment(
    file_bytes: bytes,
    filename: str
):
    unique_filename = generate_unique_filename(filename)
    provider = os.getenv("STORAGE_PROVIDER", "local").lower()
    
    if provider == "s3":
        bucket_name = os.getenv("AWS_BUCKET_NAME")
        if not bucket_name:
            raise ValueError("AWS_BUCKET_NAME must be set when STORAGE_PROVIDER is s3")
            
        s3_client = get_s3_client()
        s3_key = f"mailbox/attachments/{unique_filename}"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=file_bytes,
            ContentType="application/octet-stream"
        )
        
        return f"s3://{bucket_name}/{s3_key}"

    # Fallback to local storage
    file_path = UPLOAD_DIR / unique_filename
    with open(file_path, "wb") as file:
        file.write(file_bytes)

    return str(file_path)

def delete_attachment(
    file_path: str
):
    if file_path.startswith("s3://"):
        try:
            s3_client = get_s3_client()
            parts = file_path.replace("s3://", "").split("/")
            bucket = parts[0]
            key = "/".join(parts[1:])
            s3_client.delete_object(Bucket=bucket, Key=key)
        except Exception as e:
            print(f"Failed to delete S3 object: {e}")
    else:
        path = Path(file_path)
        if path.exists():
            path.unlink()