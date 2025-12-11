export interface InvoiceTemplateData {
  logoUrl: string;
  companyName: string;
  invoiceNumber: string;
  booking: {
    confirmationNumber?: string;
    scheduledDateTime: string;
    createdAt?: string;
    passengerCount?: number;
    vehicleType?: string;
    vehicleName?: string;
    driverName?: string;
    driverPhone?: string;
    passengerName: string;
    passengerFirstName?: string;
    passengerLastName?: string;
    passengerPhone?: string;
    passengerEmail?: string;
    passengerAddress?: string;
    pickupAddress: string;
    destinationAddress?: string;
    bookingType?: string;
    requestedHours?: number;
    paymentMethod?: string;
    status?: string;
    notes?: string;
    specialRequests?: string;
    arrBy?: string;
    poClientNumber?: string;
    billReference?: string;
    bookingFor?: string;
    bookingForPassengerName?: string;
    bookingForPassengerPhone?: string;
    actualPickupTime?: string;
    actualDropoffTime?: string;
    baseFare?: string;
    totalFare?: string;
    gratuityAmount?: string;
    surgePricingAmount?: string;
    surgePricingMultiplier?: string;
    airportFeeAmount?: string;
    discountAmount?: string;
    discountPercentage?: string;
    tollFees?: string;
    parkingFees?: string;
    extraStopFees?: string;
    waitTimeFees?: string;
    creditAmountApplied?: string;
    paidAmount?: string;
    taxAmount?: string;
  };
}

export function generateInvoiceHTML(data: InvoiceTemplateData): string {
  const { logoUrl, companyName, invoiceNumber, booking } = data;
  
  const pickupDate = new Date(booking.scheduledDateTime);
  const formattedDate = pickupDate.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
  const dayOfWeek = pickupDate.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedTime = pickupDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
  
  const bookedOn = booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A';

  const totalDue = parseFloat(booking.totalFare || '0');
  const paidAmount = parseFloat(booking.paidAmount || '0') + parseFloat(booking.creditAmountApplied || '0');
  const outstanding = Math.max(0, totalDue - paidAmount);

  const paymentStatus = booking.status === 'completed' || paidAmount >= totalDue ? 'Paid' : 'Pending';
  const paymentType = booking.paymentMethod === 'cash' ? 'Cash' : 
                      booking.paymentMethod === 'pay_later' ? 'Pay Later' :
                      booking.paymentMethod === 'ride_credit' ? 'Ride Credit' : 'Card';

  let chargesHtml = '';
  
  if (booking.baseFare) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Flat Rate</td>
        <td class="charge-value">${parseFloat(booking.baseFare).toFixed(2)}</td>
      </tr>
    `;
  }
  
  if (booking.gratuityAmount && parseFloat(booking.gratuityAmount) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Gratuity</td>
        <td class="charge-value">${parseFloat(booking.gratuityAmount).toFixed(2)}</td>
      </tr>
    `;
  }
  
  if (booking.surgePricingAmount && parseFloat(booking.surgePricingAmount) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Surge Pricing</td>
        <td class="charge-value">${parseFloat(booking.surgePricingAmount).toFixed(2)}</td>
      </tr>
    `;
  }
  
  if (booking.airportFeeAmount && parseFloat(booking.airportFeeAmount) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Airport Fee</td>
        <td class="charge-value">${parseFloat(booking.airportFeeAmount).toFixed(2)}</td>
      </tr>
    `;
  }
  
  if (booking.tollFees && parseFloat(booking.tollFees) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Toll Fees</td>
        <td class="charge-value">${parseFloat(booking.tollFees).toFixed(2)}</td>
      </tr>
    `;
  }
  
  if (booking.parkingFees && parseFloat(booking.parkingFees) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Parking Fees</td>
        <td class="charge-value">${parseFloat(booking.parkingFees).toFixed(2)}</td>
      </tr>
    `;
  }

  if (booking.extraStopFees && parseFloat(booking.extraStopFees) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Extra Stop Fees</td>
        <td class="charge-value">${parseFloat(booking.extraStopFees).toFixed(2)}</td>
      </tr>
    `;
  }

  if (booking.waitTimeFees && parseFloat(booking.waitTimeFees) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Wait Time Fees</td>
        <td class="charge-value">${parseFloat(booking.waitTimeFees).toFixed(2)}</td>
      </tr>
    `;
  }

  if (booking.taxAmount && parseFloat(booking.taxAmount) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Tax</td>
        <td class="charge-value">${parseFloat(booking.taxAmount).toFixed(2)}</td>
      </tr>
    `;
  }

  if (booking.discountAmount && parseFloat(booking.discountAmount) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Discount</td>
        <td class="charge-value">-${parseFloat(booking.discountAmount).toFixed(2)}</td>
      </tr>
    `;
  }

  if (booking.creditAmountApplied && parseFloat(booking.creditAmountApplied) > 0) {
    chargesHtml += `
      <tr>
        <td class="charge-label">Ride Credits</td>
        <td class="charge-value">-${parseFloat(booking.creditAmountApplied).toFixed(2)}</td>
      </tr>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoiceNumber}</title>
      <style>
        @page {
          size: letter;
          margin: 0.4in;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, Helvetica, sans-serif;
          font-size: 10px;
          line-height: 1.3;
          color: #000;
          background: #fff;
          padding: 12px;
          max-width: 8.5in;
          margin: 0 auto;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 2px solid #000;
        }
        
        .logo-section {
          max-width: 140px;
        }
        
        .logo-img {
          max-width: 110px;
          max-height: 70px;
          object-fit: contain;
        }
        
        .company-name {
          font-weight: bold;
          font-size: 16px;
          color: #000;
        }
        
        .header-info {
          text-align: right;
        }
        
        .header-info table {
          margin-left: auto;
        }
        
        .header-info td {
          padding: 1px 0;
        }
        
        .header-info .label {
          font-weight: bold;
          text-align: right;
          padding-right: 10px;
          font-size: 11px;
        }
        
        .header-info .value {
          font-weight: bold;
          font-size: 12px;
          text-align: left;
        }
        
        .billing-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          gap: 15px;
        }
        
        .bill-to {
          flex: 1;
        }
        
        .bill-to h3 {
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 3px;
          text-decoration: underline;
        }
        
        .bill-to p {
          margin: 1px 0;
          font-size: 10px;
        }
        
        .primary-passenger {
          flex: 1;
        }
        
        .primary-passenger h3 {
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 3px;
          text-decoration: underline;
        }
        
        .primary-passenger p {
          margin: 1px 0;
          font-size: 10px;
        }
        
        .booking-meta {
          border: 1px solid #000;
          min-width: 180px;
        }
        
        .booking-meta table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .booking-meta td {
          padding: 2px 6px;
          border-bottom: 1px solid #000;
          font-size: 10px;
        }
        
        .booking-meta tr:last-child td {
          border-bottom: none;
        }
        
        .booking-meta .label {
          font-weight: bold;
          width: 70px;
        }
        
        .trip-details {
          margin-bottom: 8px;
        }
        
        .trip-details table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
        }
        
        .trip-details th {
          background: #f5f5dc;
          border: 1px solid #000;
          padding: 5px;
          font-weight: bold;
          text-align: center;
          font-size: 10px;
        }
        
        .trip-details td {
          border: 1px solid #000;
          padding: 5px;
          text-align: center;
          font-size: 10px;
        }
        
        .routing-payment {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .routing-info {
          flex: 1.5;
          border: 2px solid #000;
        }
        
        .routing-info h4 {
          background: #f5f5dc;
          padding: 4px 8px;
          font-weight: bold;
          font-size: 10px;
          border-bottom: 1px solid #000;
        }
        
        .routing-content {
          padding: 6px 8px;
        }
        
        .routing-content p {
          margin: 2px 0;
          font-size: 10px;
        }
        
        .routing-content .label {
          font-weight: bold;
        }
        
        .payment-section {
          flex: 1;
        }
        
        .payment-grid {
          display: flex;
          gap: 6px;
          margin-bottom: 6px;
        }
        
        .payment-box {
          flex: 1;
          border: 2px solid #000;
          text-align: center;
        }
        
        .payment-box h5 {
          background: #f5f5dc;
          padding: 3px;
          font-size: 9px;
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        
        .payment-box .value {
          padding: 4px;
          font-size: 10px;
        }
        
        .charges-box {
          border: 2px solid #000;
        }
        
        .charges-box h5 {
          background: #f5f5dc;
          padding: 3px 6px;
          font-size: 9px;
          font-weight: bold;
          border-bottom: 1px solid #000;
          text-align: center;
        }
        
        .charges-box table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .charges-box td {
          padding: 2px 6px;
          font-size: 10px;
        }
        
        .charge-label {
          text-align: left;
        }
        
        .charge-value {
          text-align: right;
          font-weight: bold;
        }
        
        .charges-box .total-row td {
          font-weight: bold;
          border-top: 1px solid #000;
        }
        
        .notes-section {
          margin-bottom: 8px;
        }
        
        .notes-box {
          border: 2px solid #000;
        }
        
        .notes-box h4 {
          background: #f5f5dc;
          padding: 3px 8px;
          font-weight: bold;
          font-size: 10px;
          border-bottom: 1px solid #000;
        }
        
        .notes-content {
          padding: 4px 8px;
          min-height: 20px;
        }
        
        .notes-content p {
          font-size: 10px;
          margin: 1px 0;
        }
        
        .special-requests {
          border-top: 1px solid #000;
        }
        
        .agreement-section {
          border: 2px solid #000;
          margin-bottom: 12px;
        }
        
        .agreement-section h4 {
          background: #f5f5dc;
          padding: 3px 8px;
          font-weight: bold;
          font-size: 10px;
          border-bottom: 1px solid #000;
          text-align: center;
        }
        
        .agreement-content {
          padding: 6px 8px;
          font-size: 8px;
          line-height: 1.25;
          text-align: justify;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 15px;
          padding-top: 8px;
        }
        
        .footer-field {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .footer-field .label {
          font-weight: bold;
          font-size: 10px;
        }
        
        .footer-field .line {
          border-bottom: 1px solid #000;
          min-width: 70px;
          height: 16px;
        }
        
        .footer-field.signature .line {
          min-width: 140px;
        }
        
        .invoice-container {
          position: relative;
          min-height: 100%;
        }
        
        .cancelled-watermark {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80px;
          font-weight: bold;
          color: rgba(220, 38, 38, 0.25);
          text-transform: uppercase;
          letter-spacing: 8px;
          pointer-events: none;
          z-index: 1000;
          white-space: nowrap;
          user-select: none;
          width: 100%;
          text-align: center;
        }
        
        @media print {
          body { 
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-container {
            position: relative;
            min-height: 100vh;
          }
          .header {
            page-break-after: avoid;
          }
          .cancelled-watermark {
            position: absolute;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: rgba(220, 38, 38, 0.25) !important;
          }
        }
        
        @media screen and (max-width: 768px) {
          .cancelled-watermark {
            font-size: 50px;
            letter-spacing: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${booking.status === 'cancelled' ? '<div class="cancelled-watermark">CANCELLED</div>' : ''}
        <div class="header">
        <div class="logo-section">
          ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="logo-img" />` : `<div class="company-name">${companyName}</div>`}
        </div>
        <div class="header-info">
          <table>
            <tr>
              <td class="label">Pick-up Date:</td>
              <td class="value">${formattedDate} - ${dayOfWeek}</td>
            </tr>
            <tr>
              <td class="label">Pick-up Time:</td>
              <td class="value">${formattedTime}</td>
            </tr>
            <tr>
              <td class="label">Reservation#</td>
              <td class="value">${booking.confirmationNumber || invoiceNumber}</td>
            </tr>
            ${booking.billReference ? `
            <tr>
              <td class="label">Bill Reference:</td>
              <td class="value">${booking.billReference}</td>
            </tr>
            ` : ''}
          </table>
        </div>
      </div>
      
      <div class="billing-section">
        <div class="bill-to">
          <h3>Bill To:</h3>
          <p><strong>${booking.passengerName}</strong></p>
          ${booking.passengerAddress ? `<p>${booking.passengerAddress}</p>` : ''}
          ${booking.passengerPhone ? `<p>Mb: ${booking.passengerPhone}</p>` : ''}
        </div>
        
        <div class="primary-passenger">
          <h3>Primary Passenger:</h3>
          <p><strong>${booking.passengerName}</strong></p>
          ${booking.passengerPhone ? `<p>${booking.passengerPhone}</p>` : ''}
        </div>
        
        <div class="booking-meta">
          <table>
            <tr>
              <td class="label">Booked On:</td>
              <td>${bookedOn}</td>
            </tr>
            <tr>
              <td class="label">Arr. By:</td>
              <td>${booking.arrBy || 'Not Specified'}</td>
            </tr>
            <tr>
              <td class="label">PO/Client #:</td>
              <td>${booking.poClientNumber || 'N/A'}</td>
            </tr>
          </table>
        </div>
      </div>
      
      <div class="trip-details">
        <table>
          <thead>
            <tr>
              <th># of Pax</th>
              <th>Vehicle Type</th>
              <th>Car(s)</th>
              <th>Driver(s)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${booking.passengerCount || 1}</td>
              <td>${booking.vehicleType || 'N/A'}</td>
              <td>${booking.vehicleName || 'N/A'}</td>
              <td>${booking.driverName || 'TBD'}${booking.driverPhone ? `<br/>${booking.driverPhone}` : ''}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="routing-payment">
        <div class="routing-info">
          <h4>Passenger & Routing Information</h4>
          <div class="routing-content">
            ${booking.bookingFor === 'someone_else' && booking.bookingForPassengerName ? `
            <p><span class="label">Booked By:</span> ${booking.passengerName}</p>
            <p><span class="label">Passenger:</span> ${booking.bookingForPassengerName}</p>
            ${booking.bookingForPassengerPhone ? `<p><span class="label">Passenger Phone:</span> ${booking.bookingForPassengerPhone}</p>` : ''}
            ` : `
            <p><span class="label">Passenger:</span> ${booking.passengerName}</p>
            ${booking.passengerPhone ? `<p><span class="label">Phone:</span> ${booking.passengerPhone}</p>` : ''}
            `}
            <p style="margin-top: 6px;"><span class="label">PU:</span> -- : ${booking.pickupAddress}</p>
            ${booking.bookingType === 'hourly' && booking.requestedHours ? 
              `<p><span class="label">Duration:</span> ${booking.requestedHours} ${booking.requestedHours === 1 ? 'Hour' : 'Hours'}</p>
               ${booking.actualPickupTime ? `<p><span class="label">Actual Start:</span> ${new Date(booking.actualPickupTime).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>` : ''}
               ${booking.actualDropoffTime ? `<p><span class="label">Actual End:</span> ${new Date(booking.actualDropoffTime).toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>` : ''}` :
              booking.destinationAddress ? `<p><span class="label">DO:</span> -- : ${booking.destinationAddress}</p>` : ''
            }
          </div>
        </div>
        
        <div class="payment-section">
          <div class="payment-grid">
            <div class="payment-box">
              <h5>Pmt Type</h5>
              <div class="value">${paymentType}</div>
            </div>
            <div class="payment-box">
              <h5>Status</h5>
              <div class="value">${paymentStatus}</div>
            </div>
          </div>
          
          <div class="charges-box">
            <h5>Charges & Fees</h5>
            <table>
              ${chargesHtml || `
                <tr>
                  <td class="charge-label">Flat Rate</td>
                  <td class="charge-value">${parseFloat(booking.totalFare || '0').toFixed(2)}</td>
                </tr>
              `}
              <tr class="total-row">
                <td class="charge-label">Total Due (USD):</td>
                <td class="charge-value">${totalDue.toFixed(2)}</td>
              </tr>
              <tr>
                <td class="charge-label">Payments/Deposits (USD):</td>
                <td class="charge-value">${paidAmount.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td class="charge-label">Total Outstanding (USD):</td>
                <td class="charge-value">${outstanding.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      
      <div class="notes-section">
        <div class="notes-box">
          <h4>Notes/Comments</h4>
          <div class="notes-content">
            ${booking.notes ? `<p>${booking.notes}</p>` : '<p>&nbsp;</p>'}
          </div>
          <div class="special-requests">
            <h4>Special Requests:</h4>
            <div class="notes-content">
              ${booking.specialRequests ? `<p>${booking.specialRequests}</p>` : '<p>&nbsp;</p>'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="agreement-section">
        <h4>Standard Rental Agreement</h4>
        <div class="agreement-content">
          All deposits are NON refundable. Company is not liable in the event of mechanical breakdown while on charter and will only be responsible for making up lost time at a mutually agreed date. The client assumes full financial liability for any damage to the limousine caused during the duration of the rental by them or any members of their party. A fee of 100.00 for each carpet or seat burn. Sanitation fee is 250.00. Alcohol Consumption and drug use is prohibited by law. Any fines will be paid for by the customer. The driver has the right to terminate run without refund (if there is blatant indiscretion on the part of the client(s)). It is Illegal to stand through the sunroof. Smoking is not permitted in some of our limousines and this is left to the discretion of the driver. Overtime pay will apply after the first 15 minutes of prearranged time described on the run sheet. Not responsible for delays or the termination in winter caused by unsafe road conditions (ie. not salted, accidents, etc.). Not responsible for articles left in the limousine. Balances to be paid to the driver on the run date before the beginning of the run. Vehicles cannot be loaded beyond seating capacity.
        </div>
      </div>
      
      <div class="footer">
        <div class="footer-field">
          <span class="label">Gratuity($):</span>
          <div class="line"></div>
        </div>
        <div class="footer-field">
          <span class="label">New Total($):</span>
          <div class="line"></div>
        </div>
        <div class="footer-field signature">
          <span class="label">Signature:</span>
          <div class="line"></div>
        </div>
        <div class="footer-field">
          <span class="label">Date:</span>
          <div class="line"></div>
        </div>
      </div>
      </div>
      
      <script>
        window.onload = () => {
          window.print();
          window.onafterprint = () => window.close();
        };
      </script>
    </body>
    </html>
  `;
}
