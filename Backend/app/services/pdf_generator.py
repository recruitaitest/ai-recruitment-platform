import os
import io
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY


def format_currency_amount(amount: Any) -> str:
    """Formats salary string or numeric cleanly without font glyph issues."""
    if not amount:
        return "Rs. 0"
    s = str(amount).strip()
    s = s.replace("₹", "Rs. ").replace("Rs.  ", "Rs. ")
    if s.startswith("Rs.") or s.startswith("$") or "LPA" in s:
        return s
    try:
        val = float(s.replace(",", ""))
        if val > 1000:
            return f"Rs. {val:,.2f}"
        return f"Rs. {val} LPA"
    except Exception:
        return str(amount).replace("₹", "Rs. ")


def generate_corporate_offer_pdf(
    candidate_name: str,
    candidate_email: str,
    position_title: str,
    salary: str,
    employment_type: str = "Full Time",
    joining_date: str = "",
    offer_expiry: str = "",
    company_name: str = "RecruitAI",
    location: str = "Hyderabad, India",
    department: str = "Engineering",
    reporting_manager: str = "Director of Engineering",
    template_text_override: Optional[str] = None,
    output_filepath: Optional[str] = None,
) -> str:
    """
    Generates a high-quality, professional Corporate Offer Letter PDF.
    Returns the absolute path to the generated PDF.
    """
    if not output_filepath:
        upload_dir = "uploads/offers"
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"Offer_{candidate_name.replace(' ', '_')}_{int(time.time())}.pdf"
        output_filepath = os.path.join(upload_dir, filename)
    else:
        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)

    doc = SimpleDocTemplate(
        output_filepath,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    primary_color = colors.HexColor("#1e3a8a")  # Deep Corporate Blue
    dark_text = colors.HexColor("#0f172a")       # Slate 900
    muted_text = colors.HexColor("#475569")      # Slate 600
    border_color = colors.HexColor("#cbd5e1")    # Slate 300
    table_bg = colors.HexColor("#f8fafc")        # Slate 50

    title_style = ParagraphStyle(
        "CompanyHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=primary_color,
        alignment=TA_LEFT,
    )

    subtitle_style = ParagraphStyle(
        "CompanySubHeader",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=muted_text,
        alignment=TA_LEFT,
    )

    ref_style = ParagraphStyle(
        "RefDateStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=13,
        textColor=primary_color,
        alignment=TA_RIGHT,
    )

    ref_sub_style = ParagraphStyle(
        "RefDateSubStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=muted_text,
        alignment=TA_RIGHT,
    )

    doc_title_style = ParagraphStyle(
        "OfferDocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=primary_color,
        alignment=TA_CENTER,
        spaceAfter=10,
    )

    body_style = ParagraphStyle(
        "OfferBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=dark_text,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
    )

    bold_body_style = ParagraphStyle(
        "OfferBoldBody",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=dark_text,
    )

    section_header_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=primary_color,
        spaceBefore=8,
        spaceAfter=4,
    )

    table_cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=dark_text,
    )

    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=primary_color,
    )

    story = []

    # ─── 1. Header (Company Branding & Reference Info) ─────────────────────────
    today_str = datetime.now().strftime("%B %d, %Y")
    ref_number = f"OFF/{datetime.now().strftime('%Y%m%d')}/{int(time.time()) % 10000:04d}"

    header_table_data = [
        [
            Paragraph(f"<b>{company_name}</b>", title_style),
            Paragraph(f"<b>Reference:</b> {ref_number}", ref_style),
        ],
        [
            Paragraph("Talent Acquisition & Human Resources Division<br/>Global Enterprise Operations", subtitle_style),
            Paragraph(f"<b>Date:</b> {today_str}", ref_sub_style),
        ]
    ]

    header_table = Table(header_table_data, colWidths=[330, 202])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 6),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=12))

    # ─── 2. Recipient Block ───────────────────────────────────────────────────
    recip_data = [
        [Paragraph(f"<b>To:</b> {candidate_name}", bold_body_style)],
        [Paragraph(f"<b>Email:</b> {candidate_email}", body_style)],
        [Paragraph(f"<b>Location:</b> {location}", body_style)],
    ]
    recip_table = Table(recip_data, colWidths=[532])
    recip_table.setStyle(TableStyle([
        ('PADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
    ]))
    story.append(recip_table)

    # ─── 3. Document Title ────────────────────────────────────────────────────
    story.append(Paragraph("<b>FORMAL LETTER OF APPOINTMENT & EMPLOYMENT OFFER</b>", doc_title_style))

    # ─── 4. Salutation & Opening ──────────────────────────────────────────────
    story.append(Paragraph(f"Dear <b>{candidate_name}</b>,", body_style))
    story.append(Paragraph(
        f"Following your recent interview and evaluation process, we are pleased to extend to you a formal offer of "
        f"employment for the position of <b>{position_title}</b> at <b>{company_name}</b>. "
        f"We were impressed with your technical capabilities, background, and professional achievements, and we are confident "
        f"that your contributions will play a vital role in our ongoing innovation and business success.",
        body_style
    ))

    # ─── 5. Appointment & Position Terms ──────────────────────────────────────
    effective_joining = joining_date if joining_date else (datetime.now() + timedelta(days=14)).strftime("%B %d, %Y")
    effective_expiry = offer_expiry if offer_expiry else (datetime.now() + timedelta(days=5)).strftime("%B %d, %Y")

    story.append(Paragraph("1. Position Details & Commencement", section_header_style))
    pos_data = [
        [Paragraph("<b>Job Title / Role:</b>", table_cell_bold), Paragraph(position_title, table_cell_style)],
        [Paragraph("<b>Department / Unit:</b>", table_cell_bold), Paragraph(department, table_cell_style)],
        [Paragraph("<b>Employment Type:</b>", table_cell_bold), Paragraph(employment_type, table_cell_style)],
        [Paragraph("<b>Work Location:</b>", table_cell_bold), Paragraph(location, table_cell_style)],
        [Paragraph("<b>Date of Joining:</b>", table_cell_bold), Paragraph(effective_joining, table_cell_style)],
        [Paragraph("<b>Reporting Authority:</b>", table_cell_bold), Paragraph(reporting_manager, table_cell_style)],
    ]
    pos_table = Table(pos_data, colWidths=[160, 372])
    pos_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), table_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(pos_table)
    story.append(Spacer(1, 8))

    # ─── 6. Compensation & Benefits Structure ─────────────────────────────────
    story.append(Paragraph("2. Compensation & Benefits Structure", section_header_style))
    story.append(Paragraph(
        f"You will be eligible for a Total Annual Cost-to-Company (CTC) of <b>{format_currency_amount(salary)}</b>, "
        f"payable in accordance with the standard monthly payroll schedule and applicable statutory deductions.",
        body_style
    ))

    # Structured Compensation Breakdown Table
    comp_data = [
        [
            Paragraph("<b>Component</b>", table_cell_bold),
            Paragraph("<b>Details & Inclusions</b>", table_cell_bold),
            Paragraph("<b>Frequency / Amount</b>", table_cell_bold),
        ],
        [
            Paragraph("<b>Fixed Base Salary</b>", table_cell_style),
            Paragraph("Basic pay subject to standard income tax deductions", table_cell_style),
            Paragraph("Structured Component", table_cell_style),
        ],
        [
            Paragraph("<b>Allowances & Perks</b>", table_cell_style),
            Paragraph("House Rent Allowance (HRA), Special & Conveyance Allowances", table_cell_style),
            Paragraph("Monthly Inclusion", table_cell_style),
        ],
        [
            Paragraph("<b>Statutory Retirals & Benefits</b>", table_cell_style),
            Paragraph("Provident Fund (PF), Gratuity, and Comprehensive Group Health Insurance", table_cell_style),
            Paragraph("As per Corporate Policy", table_cell_style),
        ],
        [
            Paragraph("<b>Total Annual CTC</b>", table_cell_bold),
            Paragraph("<b>All-inclusive Annual Compensation Package</b>", table_cell_bold),
            Paragraph(f"<b>{format_currency_amount(salary)}</b>", table_cell_bold),
        ],
    ]
    comp_table = Table(comp_data, colWidths=[150, 242, 140])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
        ('BACKGROUND', (0, 1), (-1, -2), table_bg),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#eff6ff")),
        ('BOX', (0, 0), (-1, -1), 0.5, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(comp_table)
    story.append(Spacer(1, 8))

    # ─── 7. Standard Terms, Probation & Confidentiality ────────────────────────
    story.append(Paragraph("3. Terms of Employment & Conditions", section_header_style))
    story.append(Paragraph(
        "<b>Probation Period:</b> You will be on probation for a period of three (3) months from your date of joining. "
        "Upon successful completion, your employment will be confirmed in writing.<br/>"
        "<b>Confidentiality & IP:</b> You will be required to execute the company's standard Non-Disclosure Agreement (NDA) "
        "and Proprietary Information & Inventions Agreement upon onboarding.<br/>"
        "<b>Background Verification:</b> This offer is contingent upon the satisfactory completion of background reference checks.",
        body_style
    ))

    # ─── PAGE BREAK: Move Section 4 & Signatures cleanly to Page 2 ────────────
    story.append(PageBreak())

    # ─── 8. Offer Validity & Acceptance Deadline (Page 2) ─────────────────────
    story.append(Paragraph(f"<b>{company_name} — Employment Offer Letter (Contd.)</b>", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=primary_color, spaceBefore=4, spaceAfter=14))

    story.append(Paragraph("4. Acceptance of Offer & Next Steps", section_header_style))
    story.append(Paragraph(
        f"This offer of employment is valid until <b>{effective_expiry}</b>. Please sign, date, and return a duplicate "
        f"copy of this letter to confirm your formal acceptance of the terms outlined herein. "
        f"Upon receipt of your acceptance, our Human Resources Onboarding team will reach out with pre-joining documentation "
        f"and orientation details.",
        body_style
    ))
    story.append(Spacer(1, 24))

    # ─── 9. Signature Block ───────────────────────────────────────────────────
    sig_data = [
        [
            Paragraph(f"<b>For {company_name}</b>", bold_body_style),
            Paragraph("<b>Candidate Acceptance & Acknowledgment</b>", bold_body_style),
        ],
        [
            Paragraph("<br/><br/>____________________________________<br/><b>Authorized Signatory</b><br/>Director — Human Resources & Talent Operations", body_style),
            Paragraph(f"<br/><br/>____________________________________<br/><b>{candidate_name}</b><br/>Date: ________________________", body_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[266, 266])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(sig_table)

    # Build PDF
    doc.build(story)
    return output_filepath
