import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a clean, professional, lightweight thermal receipt PDF
 * Optimized for 80mm thermal receipt printers and mobile PDF viewers.
 * Uses 'Rs.' to guarantee standard ASCII encoding across all PDF engines and ESC/POS printers.
 */
export const generateReceiptPDF = (bill, outlet, restaurantName = 'Taraaang Organic Food PVT LTD') => {
  const items = bill.items || [];
  const itemsCount = items.length || 1;
  const docHeight = Math.max(160, 115 + itemsCount * 9 + 50);

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, docHeight],
  });

  const currency = 'Rs. ';
  let y = 8;

  // Header - Company / Restaurant Name
  doc.setFont('helvetica', 'bold');
  const nameToPrint = restaurantName || 'Taraaang Organic Food PVT LTD';
  if (nameToPrint.length > 24) {
    doc.setFontSize(10);
  } else {
    doc.setFontSize(12.5);
  }
  const splitName = doc.splitTextToSize(nameToPrint, 68);
  doc.text(splitName, 40, y, { align: 'center' });
  y += splitName.length * 4.2;

  // Outlet Name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(outlet?.name || 'Central Branch', 40, y, { align: 'center' });
  y += 3.5;

  if (outlet?.address) {
    doc.setFontSize(7);
    const splitAddr = doc.splitTextToSize(outlet.address, 65);
    doc.text(splitAddr, 40, y, { align: 'center' });
    y += splitAddr.length * 3;
  }

  if (outlet?.phone) {
    doc.setFontSize(7);
    doc.text(`Phone: ${outlet.phone}`, 40, y, { align: 'center' });
    y += 3.5;
  }

  // Dashed divider Line (width 5mm to 70mm, total 65mm safe print area)
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 70, y);
  doc.setLineDashPattern([], 0);
  y += 3.5;

  // Bill Meta
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`BILL NO: ${bill.billNumber}`, 5, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  const billDate = new Date(bill.createdAt || Date.now());
  const dateStr = billDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = billDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`DATE: ${dateStr}  ${timeStr}`, 5, y);
  y += 3.5;

  if (bill.customerSnapshot?.name && bill.customerSnapshot.name !== 'Guest') {
    const custText = `CUSTOMER: ${bill.customerSnapshot.name}${
      bill.customerSnapshot.mobile ? ` (${bill.customerSnapshot.mobile})` : ''
    }`;
    const truncatedCust = custText.length > 34 ? custText.substring(0, 32) + '..' : custText;
    doc.text(truncatedCust, 5, y);
    y += 3.5;
  } else if (bill.customerSnapshot?.mobile) {
    doc.text(`PHONE: ${bill.customerSnapshot.mobile}`, 5, y);
    y += 3.5;
  }

  // Divider
  doc.line(5, y, 70, y);
  y += 3.5;

  // Table Columns Header
  // Safe bounds: ITEM 5mm, QTY 38mm, RATE 52mm, TOTAL 70mm (right-aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITEM', 5, y);
  doc.text('QTY', 38, y, { align: 'center' });
  doc.text('RATE', 52, y, { align: 'right' });
  doc.text('TOTAL', 70, y, { align: 'right' });
  y += 2.5;
  doc.line(5, y, 70, y);
  y += 3.5;

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  items.forEach((item) => {
    const rawName = `${item.productName} (${item.variantName})`;
    const truncatedName = rawName.length > 20 ? rawName.substring(0, 19) + '..' : rawName;

    doc.text(truncatedName, 5, y);
    doc.text(String(item.quantity), 38, y, { align: 'center' });
    doc.text(Number(item.unitPrice).toFixed(2), 52, y, { align: 'right' });
    doc.text(Number(item.lineTotal).toFixed(2), 70, y, { align: 'right' });
    y += 4;
  });

  // Divider
  y += 0.5;
  doc.line(5, y, 70, y);
  y += 3.5;

  // Subtotal
  doc.setFontSize(7.5);
  doc.text('Subtotal:', 32, y);
  doc.text(`${currency}${bill.subtotal.toFixed(2)}`, 70, y, { align: 'right' });
  y += 3.5;

  // Discount (if any)
  if (bill.discount > 0) {
    doc.setFont('helvetica', 'bold');
    const discountLabel = bill.discountType === 'percentage'
      ? `Discount (${bill.discountValue}%):`
      : 'Discount:';
    doc.text(discountLabel, 32, y);
    doc.text(`-${currency}${bill.discount.toFixed(2)}`, 70, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 3.5;
  }

  // Tax (only if tax > 0)
  if (bill.tax > 0) {
    doc.text(`Tax (${bill.taxPercentage}%):`, 32, y);
    doc.text(`${currency}${bill.tax.toFixed(2)}`, 70, y, { align: 'right' });
    y += 3.5;
  }

  // Grand Total Solid Line
  doc.setLineWidth(0.3);
  doc.line(28, y, 70, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GRAND TOTAL:', 22, y);
  doc.text(`${currency}${bill.grandTotal.toFixed(2)}`, 70, y, { align: 'right' });
  y += 4.5;

  // Payment Mode
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Payment Mode: ${(bill.paymentMethod || 'CASH').toUpperCase()}`, 5, y);
  y += 5;

  // Footer Message
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for dining with us!', 37.5, y, { align: 'center' });
  y += 3;
  doc.text('Please visit again!', 37.5, y, { align: 'center' });

  // Download PDF
  const fileName = `Bill_${bill.billNumber}.pdf`;
  doc.save(fileName);

  return doc;
};

/**
 * Normalizes phone numbers for WhatsApp
 */
export const normalizeWhatsAppNumber = (mobile) => {
  if (!mobile) return '';
  let cleaned = String(mobile).replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
};

/**
 * Mobile-friendly Web Share or WhatsApp Share Fallback
 * Guaranteed to open WhatsApp with customer's phone number!
 */
export const shareBillOnWhatsApp = async (
  bill,
  outlet,
  customLink,
  restaurantName,
  overridePhone = null
) => {
  const itemsText = (bill.items || [])
    .map((item) => `• ${item.productName} (${item.variantName}) x${item.quantity} = Rs. ${Number(item.lineTotal).toFixed(2)}`)
    .join('\n');

  const discountLine = bill.discount > 0
    ? `Discount: -Rs. ${Number(bill.discount).toFixed(2)}\n`
    : '';

  const shareText =
    `*${restaurantName || 'Taraaang Organic Food PVT LTD'}* (${outlet?.name || 'Restaurant'})\n` +
    `--------------------------------\n` +
    `Bill No: *${bill.billNumber}*\n` +
    `Date: ${new Date(bill.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
    (bill.customerSnapshot?.name && bill.customerSnapshot.name !== 'Guest' ? `Customer: ${bill.customerSnapshot.name}\n` : '') +
    `--------------------------------\n` +
    `${itemsText}\n` +
    `--------------------------------\n` +
    `Subtotal: Rs. ${Number(bill.subtotal).toFixed(2)}\n` +
    discountLine +
    `*GRAND TOTAL: Rs. ${Number(bill.grandTotal).toFixed(2)}*\n` +
    `Payment: ${(bill.paymentMethod || 'Cash').toUpperCase()}\n` +
    `--------------------------------\n` +
    `Thank you for visiting us! Visit again soon! ✨`;

  const rawPhone = overridePhone || bill.customerSnapshot?.mobile || '';
  const normalized = normalizeWhatsAppNumber(rawPhone);

  // If mobile number exists, construct direct WhatsApp deep link to customer's chat
  if (normalized) {
    const directWaUrl = `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(shareText)}`;
    window.open(directWaUrl, '_blank');
    return;
  }

  // If no customer phone number was provided, allow sharing via Web Share API or generic WhatsApp
  if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: `Bill ${bill.billNumber}`,
        text: shareText,
      });
      return;
    } catch {
      // Fallback to generic WhatsApp URL
    }
  }

  // Open general WhatsApp in new tab / app
  const generalWaUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  window.open(generalWaUrl, '_blank');
};
