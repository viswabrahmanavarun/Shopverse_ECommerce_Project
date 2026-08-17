import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime

def generate_invoice_pdf(order) -> bytes:
    """
    Generates a beautifully styled PDF invoice using ReportLab.
    """
    buffer = io.BytesIO()
    # A4 width is 595.27 points. With 40pt margins, printable width is 515.27
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    elements = []
    styles = getSampleStyleSheet()
    
    BRAND_COLOR = colors.HexColor("#059669")  # Emerald Green
    BRAND_DARK = colors.HexColor("#064e3b")
    TEXT_MAIN = colors.HexColor("#1e293b")
    TEXT_MUTED = colors.HexColor("#64748b")
    BG_LIGHT = colors.HexColor("#f8fafc")
    
    # Custom Styles
    brand_title_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=BRAND_COLOR,
        spaceAfter=5
    )
    
    invoice_title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=TEXT_MAIN,
        alignment=2, # Right aligned
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=BRAND_COLOR,
        spaceAfter=10,
        textTransform='uppercase'
    )
    
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=TEXT_MAIN,
        leading=14
    )
    
    muted_style = ParagraphStyle(
        'MutedText',
        parent=normal_style,
        textColor=TEXT_MUTED,
        fontSize=9
    )

    # 1. Header (Logo/Name left, INVOICE right)
    header_data = [
        [Paragraph("<b>Shopverse</b>", brand_title_style), Paragraph("<b>INVOICE</b>", invoice_title_style)],
        [Paragraph("Your Premium eCommerce Destination", muted_style), Paragraph(f"Date: {datetime.utcnow().strftime('%B %d, %Y')}", ParagraphStyle('RightMuted', parent=muted_style, alignment=2))]
    ]
    header_table = Table(header_data, colWidths=[3.5 * inch, 3.5 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 30))
    
    # Divider line
    divider = Table([[""]], colWidths=[7.15 * inch])
    divider.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 1.5, BRAND_COLOR),
    ]))
    elements.append(divider)
    elements.append(Spacer(1, 20))
    
    # 2. Side-by-side Info (Order Details & Shipping)
    order_date = order.created_at.strftime("%b %d, %Y %H:%M") if isinstance(order.created_at, datetime) else str(order.created_at)
    
    order_info = f"""
    <b>Order ID:</b> {order.id}<br/>
    <b>Order Date:</b> {order_date}<br/>
    <b>Payment Status:</b> {order.payment_status.upper()}<br/>
    <b>Order Status:</b> {order.order_status.upper()}
    """
    
    addr = order.shipping_address
    shipping_info = f"""
    <b>{addr.name or 'Customer'}</b><br/>
    {addr.street}<br/>
    {addr.city}, {addr.state} - {addr.pincode}<br/>
    {addr.country}<br/>
    <b>Phone:</b> {addr.phone}
    """
    
    info_data = [
        [Paragraph("<b>ORDER DETAILS</b>", section_header_style), Paragraph("<b>SHIPPING TO</b>", section_header_style)],
        [Paragraph(order_info, normal_style), Paragraph(shipping_info, normal_style)]
    ]
    
    info_table = Table(info_data, colWidths=[3.5 * inch, 3.5 * inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('TOPPADDING', (0,0), (-1,-1), 15),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 30))
    
    # 3. Itemized Table
    elements.append(Paragraph("<b>ITEMS ORDERED</b>", section_header_style))
    
    # Table Header
    table_data = [["Product Description", "Qty", "Unit Price", "Total Price"]]
    
    # Table Rows
    for item in order.items:
        table_data.append([
            Paragraph(item.name, normal_style),
            str(item.quantity),
            f"Rs. {item.price:,.2f}",
            f"Rs. {item.price * item.quantity:,.2f}"
        ])
        
    items_table = Table(table_data, colWidths=[4.15 * inch, 0.6 * inch, 1.2 * inch, 1.2 * inch])
    
    # Base styling for items
    ts = [
        # Header styling
        ('BACKGROUND', (0,0), (-1,0), BRAND_COLOR),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (1,0), (-1,0), 'CENTER'),
        ('ALIGN', (2,0), (-1,0), 'RIGHT'),
        ('ALIGN', (3,0), (-1,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('TOPPADDING', (0,0), (-1,0), 10),
        
        # Data rows styling
        ('VALIGN', (0,1), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,1), (1,-1), 'CENTER'),
        ('ALIGN', (2,1), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,1), (-1,-1), 12),
        ('TOPPADDING', (0,1), (-1,-1), 12),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]
    
    # Alternate row colors
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            ts.append(('BACKGROUND', (0,i), (-1,i), BG_LIGHT))
            
    items_table.setStyle(TableStyle(ts))
    elements.append(items_table)
    elements.append(Spacer(1, 20))
    
    # 4. Totals Section (Aligned Right)
    subtotal = order.total_amount + order.discount_amount
    
    totals_data = [
        ["Subtotal:", f"Rs. {subtotal:,.2f}"]
    ]
    
    if order.discount_amount > 0:
        totals_data.append([f"Discount ({order.coupon_code or 'Promo'}):", f"- Rs. {order.discount_amount:,.2f}"])
        
    totals_data.append(["Total Amount:", f"Rs. {order.total_amount:,.2f}"])
    
    totals_table = Table(totals_data, colWidths=[5.5 * inch, 1.65 * inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'RIGHT'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-2), 'Helvetica'),
        ('TEXTCOLOR', (0,0), (-1,-1), TEXT_MAIN),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        
        # Grand Total styling
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,-1), (-1,-1), BRAND_DARK),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#d1fae5")), # Light green highlight
        ('TOPPADDING', (0,-1), (-1,-1), 10),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 10),
    ]))
    
    elements.append(totals_table)
    elements.append(Spacer(1, 50))
    
    # 5. Footer
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=TEXT_MUTED,
        alignment=1 # Center
    )
    elements.append(Paragraph("<b>Thank you for shopping with Shopverse!</b>", footer_style))
    elements.append(Paragraph("If you have any questions concerning this invoice, contact support@shopverse.com", footer_style))
    
    # Build the PDF
    doc.build(elements)
    
    # Get the value from buffer
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
