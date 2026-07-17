def extract_attachments(payload):

    attachments = []

    for part in payload.get("parts", []):

        if part.get("filename"):

            attachments.append({

                "filename": part.get("filename"),

                "mime_type": part.get("mimeType"),

                "attachment_id": (
                    part.get("body", {})
                    .get("attachmentId")
                ),

                "size": (
                    part.get("body", {})
                    .get("size", 0)
                )

            })

        if part.get("parts"):
            attachments.extend(
                extract_attachments(part)
            )

    return attachments