import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime

def generate_invoice_pdf(order) -> bytes:
    """
    Generates a PDF invoice for the given order using ReportLab and returns it as bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=20
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=30
    )
    
    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=10
    )
    
    normal_style = styles['Normal']

    # 1. Header (Company Info & Invoice Title)
    elements.append(Paragraph("<b>Shopverse</b>", title_style))
    elements.append(Paragraph("Your Premium eCommerce Destination<br/>Invoice / Receipt", subtitle_style))
    
    # 2. Order Metadata
    order_date = order.created_at.strftime("%B %d, %Y - %I:%M %p") if isinstance(order.created_at, datetime) else str(order.created_at)
    
    metadata_data = [
        ["Order ID:", str(order.id)],
        ["Order Date:", order_date],
        ["Payment Status:", order.payment_status.upper()],
        ["Order Status:", order.order_status.upper()]
    ]
    
    metadata_table = Table(metadata_data, colWidths=[2 * inch, 4 * inch])
    metadata_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor("#334155")),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(metadata_table)
    elements.append(Spacer(1, 20))
    
    # 3. Customer Details (Billing/Shipping)
    elements.append(Paragraph("<b>Shipping Details</b>", header_style))
    addr = order.shipping_address
    addr_text = f"""
    {addr.name or 'Customer'}<br/>
    {addr.street}<br/>
    {addr.city}, {addr.state} - {addr.pincode}<br/>
    {addr.country}<br/>
    Phone: {addr.phone}
    """
    elements.append(Paragraph(addr_text, normal_style))
    elements.append(Spacer(1, 20))
    
    # 4. Itemized Table
    elements.append(Paragraph("<b>Order Items</b>", header_style))
    
    table_data = [["Item", "Quantity", "Unit Price", "Total"]]
    for item in order.items:
        table_data.append([
            item.name,
            str(item.quantity),
            f"Rs. {item.price:,.2f}",
            f"Rs. {item.price * item.quantity:,.2f}"
        ])
        
    # Totals
    subtotal = order.total_amount + order.discount_amount
    table_data.append(["", "", "Subtotal:", f"Rs. {subtotal:,.2f}"])
    if order.discount_amount > 0:
        table_data.append(["", "", f"Discount ({order.coupon_code}):", f"- Rs. {order.discount_amount:,.2f}"])
    table_data.append(["", "", "Total Amount:", f"Rs. {order.total_amount:,.2f}"])
    
    items_table = Table(table_data, colWidths=[3.5 * inch, 1 * inch, 1.25 * inch, 1.25 * inch])
    
    # Style the table
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('TOPPADDING', (0,0), (-1,0), 12),
        
        # Grid lines
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        
        # Alignment
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        
        # Padding for data rows
        ('TOPPADDING', (0,1), (-1,-1), 8),
        ('BOTTOMPADDING', (0,1), (-1,-1), 8),
        
        # Bold totals
        ('FONTNAME', (2,-3), (-1,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (3,-1), (3,-1), colors.HexColor("#10b981")), # Green total
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 40))
    
    # Footer
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1 # Center
    )
    elements.append(Paragraph("Thank you for shopping with Shopverse!", footer_style))
    elements.append(Paragraph("If you have any questions, please contact our support team.", footer_style))
    
    # Build the PDF
    doc.build(elements)
    
    # Get the value from buffer
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    return pdf_bytes
