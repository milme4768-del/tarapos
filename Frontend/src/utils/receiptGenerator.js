import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a clean, professional, lightweight thermal receipt PDF
 * Optimized for 80mm thermal receipt printers and mobile PDF viewers.
 */
export const generateReceiptPDF = (
  bill,
  outlet,
  restaurantName = 'Taraaang Organic Food PVT LTD',
  shouldDownload = true
) => {
  const items = bill.items || [];

  // Calculate total rendered lines for all items to dynamically adjust page height
  let totalItemLines = 0;
  items.forEach((item) => {
    let fullName = item.productName || 'Item';
    if (
      item.variantName &&
      !['regular', 'standard', 'default'].includes(item.variantName.toLowerCase().trim()) &&
      !fullName.toLowerCase().includes(item.variantName.toLowerCase().trim())
    ) {
      fullName += ` (${item.variantName})`;
    }
    const approxLines = Math.max(1, Math.ceil(fullName.length / 21));
    totalItemLines += approxLines;
  });

  const baseHeaderFooterHeight = 120;
  const itemsHeight = totalItemLines * 4.5;
  const docHeight = Math.max(160, baseHeaderFooterHeight + itemsHeight + 50);

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, docHeight],
  });

  const currency = 'Rs. ';
  let y = 8;

  // Header - Company / Restaurant Name
  doc.setFont('helvetica', 'bold');
  let nameToPrint = (restaurantName || 'Taraaang Organic Food PVT LTD').trim();
  if (!nameToPrint.toUpperCase().includes('PVT LTD') && !nameToPrint.toUpperCase().includes('PVT. LTD.')) {
    nameToPrint = `${nameToPrint} PVT LTD`;
  }
  doc.setFontSize(10.5);
  const splitName = doc.splitTextToSize(nameToPrint, 70);
  doc.text(splitName, 40, y, { align: 'center' });
  y += splitName.length * 4.2;

  // Outlet Name (only if outlet is selected)
  if (outlet && outlet.name) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(outlet.name, 40, y, { align: 'center' });
    y += 3.5;

    if (outlet.address) {
      doc.setFontSize(7);
      const splitAddr = doc.splitTextToSize(outlet.address, 68);
      doc.text(splitAddr, 40, y, { align: 'center' });
      y += splitAddr.length * 3;
    }

    if (outlet.phone) {
      doc.setFontSize(7);
      doc.text(`Phone: ${outlet.phone}`, 40, y, { align: 'center' });
      y += 3.5;
    }
  }

  // Dashed divider Line (width 5mm to 75mm, total 70mm safe print area)
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
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
    const splitCust = doc.splitTextToSize(custText, 70);
    doc.text(splitCust, 5, y);
    y += splitCust.length * 3.5;
  } else if (bill.customerSnapshot?.mobile) {
    doc.text(`PHONE: ${bill.customerSnapshot.mobile}`, 5, y);
    y += 3.5;
  }

  // Divider
  doc.line(5, y, 75, y);
  y += 3.5;

  // Table Columns Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ITEM', 5, y);
  doc.text('QTY', 44, y, { align: 'center' });
  doc.text('RATE', 59, y, { align: 'right' });
  doc.text('TOTAL', 75, y, { align: 'right' });
  y += 2.5;
  doc.line(5, y, 75, y);
  y += 3.5;

  // Items List
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  items.forEach((item) => {
    let fullName = item.productName || 'Item';
    if (
      item.variantName &&
      !['regular', 'standard', 'default'].includes(item.variantName.toLowerCase().trim()) &&
      !fullName.toLowerCase().includes(item.variantName.toLowerCase().trim())
    ) {
      fullName += ` (${item.variantName})`;
    }

    // Split item name so long names continue onto the next line
    const itemLines = doc.splitTextToSize(fullName, 36);

    // Print first line with Qty, Rate, and Total aligned
    doc.text(itemLines[0], 5, y);
    doc.text(String(item.quantity), 44, y, { align: 'center' });
    doc.text(Number(item.unitPrice).toFixed(2), 59, y, { align: 'right' });
    doc.text(Number(item.lineTotal).toFixed(2), 75, y, { align: 'right' });

    // Print subsequent lines of the wrapped item name
    for (let i = 1; i < itemLines.length; i++) {
      y += 3.5;
      doc.text(itemLines[i], 5, y);
    }

    y += 4.2;
  });

  // Divider
  y += 0.5;
  doc.line(5, y, 75, y);
  y += 3.5;

  // Subtotal
  doc.setFontSize(7.5);
  doc.text('Subtotal:', 35, y);
  doc.text(`${currency}${bill.subtotal.toFixed(2)}`, 75, y, { align: 'right' });
  y += 3.5;

  // Discount (if any)
  if (bill.discount > 0) {
    doc.setFont('helvetica', 'bold');
    const discountLabel = bill.discountType === 'percentage'
      ? `Discount (${bill.discountValue}%):`
      : 'Discount:';
    doc.text(discountLabel, 35, y);
    doc.text(`-${currency}${bill.discount.toFixed(2)}`, 75, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 3.5;
  }

  // Tax (only if tax > 0)
  if (bill.tax > 0) {
    doc.text(`Tax (${bill.taxPercentage}%):`, 35, y);
    doc.text(`${currency}${bill.tax.toFixed(2)}`, 75, y, { align: 'right' });
    y += 3.5;
  }

  // Grand Total Solid Line
  doc.setLineWidth(0.3);
  doc.line(28, y, 75, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('GRAND TOTAL:', 22, y);
  doc.text(`${currency}${bill.grandTotal.toFixed(2)}`, 75, y, { align: 'right' });
  y += 4.5;

  // Payment Mode
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Payment Mode: ${(bill.paymentMethod || 'CASH').toUpperCase()}`, 5, y);
  y += 5;

  // Footer Message
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for dining with us!', 40, y, { align: 'center' });
  y += 3;
  doc.text('Please visit again!', 40, y, { align: 'center' });

  // Download PDF if requested
  const fileName = `Bill_${bill.billNumber}.pdf`;
  if (shouldDownload) {
    doc.save(fileName);
  }

  return doc;
};

/**
 * Synchronously generates and downloads a clean high-resolution JPEG receipt image
 */
export const downloadReceiptImage = (bill, outlet, restaurantName = 'Taraaang Organic Food PVT LTD') => {
  if (typeof document === 'undefined') return;

  const items = bill.items || [];
  const currency = 'Rs. ';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const width = 560; // Standard 80mm high-res thermal width
  const pad = 24;

  // Font styles
  const fontRegular = '15px "Courier New", Courier, monospace';
  const fontBold = 'bold 15px "Courier New", Courier, monospace';
  const fontTitle = 'bold 20px "Courier New", Courier, monospace';
  const fontSub = '13px "Courier New", Courier, monospace';

  // Estimate lines
  let estimatedLines = 0;
  items.forEach((item) => {
    let name = item.productName || 'Item';
    if (
      item.variantName &&
      !['regular', 'standard', 'default'].includes(item.variantName.toLowerCase().trim()) &&
      !name.toLowerCase().includes(item.variantName.toLowerCase().trim())
    ) {
      name += ` (${item.variantName})`;
    }
    estimatedLines += Math.max(1, Math.ceil(name.length / 22));
  });

  const totalHeight = Math.max(
    480,
    360 + estimatedLines * 28 + (bill.discount > 0 ? 30 : 0) + (bill.tax > 0 ? 30 : 0)
  );
  canvas.width = width;
  canvas.height = totalHeight;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  ctx.fillStyle = '#111827';
  let y = 35;

  // Header Title
  ctx.font = fontTitle;
  ctx.textAlign = 'center';
  let nameToPrint = (restaurantName || 'Taraaang Organic Food PVT LTD').trim();
  if (!nameToPrint.toUpperCase().includes('PVT LTD') && !nameToPrint.toUpperCase().includes('PVT. LTD.')) {
    nameToPrint = `${nameToPrint} PVT LTD`;
  }
  ctx.fillText(nameToPrint, width / 2, y);
  y += 24;

  if (outlet && outlet.name) {
    ctx.font = fontSub;
    ctx.fillText(outlet.name, width / 2, y);
    y += 18;

    if (outlet.address) {
      ctx.fillText(outlet.address, width / 2, y);
      y += 18;
    }
    if (outlet.phone) {
      ctx.fillText(`Phone: ${outlet.phone}`, width / 2, y);
      y += 18;
    }
  }

  // Dashed line
  y += 6;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.strokeStyle = '#9ca3af';
  ctx.stroke();
  ctx.setLineDash([]);
  y += 22;

  // Meta details
  ctx.textAlign = 'left';
  ctx.font = fontBold;
  ctx.fillText(`BILL NO: ${bill.billNumber}`, pad, y);
  y += 20;

  ctx.font = fontRegular;
  const billDate = new Date(bill.createdAt || Date.now());
  const dateStr = billDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = billDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  ctx.fillText(`DATE: ${dateStr}  ${timeStr}`, pad, y);
  y += 20;

  if (bill.customerSnapshot?.name && bill.customerSnapshot.name !== 'Guest') {
    const cust = `CUSTOMER: ${bill.customerSnapshot.name}${
      bill.customerSnapshot.mobile ? ` (${bill.customerSnapshot.mobile})` : ''
    }`;
    ctx.fillText(cust, pad, y);
    y += 20;
  } else if (bill.customerSnapshot?.mobile) {
    ctx.fillText(`PHONE: ${bill.customerSnapshot.mobile}`, pad, y);
    y += 20;
  }

  // Header bar separator
  y += 4;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.strokeStyle = '#111827';
  ctx.stroke();
  y += 20;

  // Table Column Headers
  ctx.font = fontBold;
  ctx.textAlign = 'left';
  ctx.fillText('ITEM', pad, y);
  ctx.textAlign = 'center';
  ctx.fillText('QTY', 320, y);
  ctx.textAlign = 'right';
  ctx.fillText('RATE', 420, y);
  ctx.fillText('TOTAL', width - pad, y);
  y += 10;

  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();
  y += 22;

  // Items list
  ctx.font = fontRegular;
  items.forEach((item) => {
    let fullName = item.productName || 'Item';
    if (
      item.variantName &&
      !['regular', 'standard', 'default'].includes(item.variantName.toLowerCase().trim()) &&
      !fullName.toLowerCase().includes(item.variantName.toLowerCase().trim())
    ) {
      fullName += ` (${item.variantName})`;
    }

    const maxItemWidth = 270;
    const words = fullName.split(' ');
    const lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      if (ctx.measureText(testLine).width < maxItemWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    // Line 1 with numbers
    ctx.textAlign = 'left';
    ctx.fillText(lines[0], pad, y);
    ctx.textAlign = 'center';
    ctx.fillText(String(item.quantity), 320, y);
    ctx.textAlign = 'right';
    ctx.fillText(Number(item.unitPrice).toFixed(2), 420, y);
    ctx.fillText(Number(item.lineTotal).toFixed(2), width - pad, y);

    for (let l = 1; l < lines.length; l++) {
      y += 20;
      ctx.textAlign = 'left';
      ctx.fillText(lines[l], pad, y);
    }
    y += 26;
  });

  // Totals divider
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.strokeStyle = '#9ca3af';
  ctx.stroke();
  ctx.setLineDash([]);
  y += 22;

  // Subtotal
  ctx.textAlign = 'left';
  ctx.fillText('Subtotal:', 260, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${currency}${bill.subtotal.toFixed(2)}`, width - pad, y);
  y += 22;

  if (bill.discount > 0) {
    ctx.textAlign = 'left';
    ctx.fillText('Discount:', 260, y);
    ctx.textAlign = 'right';
    ctx.fillText(`-${currency}${bill.discount.toFixed(2)}`, width - pad, y);
    y += 22;
  }

  if (bill.tax > 0) {
    ctx.textAlign = 'left';
    ctx.fillText(`Tax (${bill.taxPercentage}%):`, 260, y);
    ctx.textAlign = 'right';
    ctx.fillText(`${currency}${bill.tax.toFixed(2)}`, width - pad, y);
    y += 22;
  }

  // Grand total solid border
  y += 4;
  ctx.beginPath();
  ctx.moveTo(220, y);
  ctx.lineTo(width - pad, y);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.lineWidth = 1;
  y += 24;

  ctx.font = fontTitle;
  ctx.textAlign = 'left';
  ctx.fillText('GRAND TOTAL:', 160, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${currency}${bill.grandTotal.toFixed(2)}`, width - pad, y);
  y += 32;

  ctx.font = fontRegular;
  ctx.textAlign = 'left';
  ctx.fillText(`Payment Mode: ${(bill.paymentMethod || 'CASH').toUpperCase()}`, pad, y);
  y += 30;

  ctx.textAlign = 'center';
  ctx.font = fontSub;
  ctx.fillText('Thank you for dining with us! Please visit again! ✨', width / 2, y);

  // Synchronous download
  try {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Bill_${bill.billNumber}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.warn('[ReceiptImage] Could not download image directly:', err);
  }
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
 * Constructs clean formatted bill text message for WhatsApp
 */
export const buildWhatsAppText = (bill, outlet, restaurantName) => {
  const itemsText = (bill.items || [])
    .map((item) => `• ${item.productName} (${item.variantName}) x${item.quantity} = Rs. ${Number(item.lineTotal).toFixed(2)}`)
    .join('\n');

  const discountLine = bill.discount > 0
    ? `Discount: -Rs. ${Number(bill.discount).toFixed(2)}\n`
    : '';

  let nameToShare = (restaurantName || 'Taraaang Organic Food PVT LTD').trim();
  if (!nameToShare.toUpperCase().includes('PVT LTD') && !nameToShare.toUpperCase().includes('PVT. LTD.')) {
    nameToShare = `${nameToShare} PVT LTD`;
  }

  const outletHeader = outlet && outlet.name ? ` (${outlet.name})` : '';

  return (
    `*${nameToShare}*${outletHeader}\n` +
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
    `Thank you for visiting us! Visit again soon! ✨`
  );
};

/**
 * Synchronously downloads the bill (PDF or JPG) and redirects directly to WhatsApp
 * without ANY async popup-blocker delays!
 */
export const shareBillOnWhatsApp = (
  bill,
  outlet,
  customLink,
  restaurantName,
  overridePhone = null,
  format = 'pdf' // 'pdf' or 'image'
) => {
  const rawPhone = overridePhone || bill.customerSnapshot?.mobile || '';
  const normalized = normalizeWhatsAppNumber(rawPhone);
  const shareText = buildWhatsAppText(bill, outlet, restaurantName);

  // 1. Instantly trigger download of the receipt file (PDF or JPG image) synchronously
  try {
    if (format === 'image') {
      downloadReceiptImage(bill, outlet, restaurantName);
    } else {
      generateReceiptPDF(bill, outlet, restaurantName, true);
    }
  } catch (err) {
    console.warn('[WhatsApp] Could not trigger receipt download:', err);
  }

  // 2. Build direct WhatsApp URL
  const waUrl = normalized
    ? `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(shareText)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  // 3. Immediately redirect to WhatsApp directly (zero async delay = never blocked by browser)
  const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) {
    window.location.href = waUrl;
  } else {
    const newTab = window.open(waUrl, '_blank');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = waUrl;
    }
  }
};
