import{b as G,o as J,u as W,w as K,r as l,a as X,p as _,j as e,B as p,X as Z}from"./index-DmCq9KJi.js";import{C as E,a as z}from"./card-BMRi-t1C.js";import{D as ee,a as te,b as se,c as ae,e as ie}from"./dialog-BUYXlx-f.js";import{I as u,L as T}from"./label-CJ6jYvn1.js";import{A as ne}from"./arrow-left-DECNAehY.js";import{S as re}from"./search-Bb0Nk8fI.js";import{C as oe}from"./calendar-BBcgCWik.js";import{F as b}from"./file-text-DME9o3y-.js";import{E as le}from"./eye-BVD9LdTp.js";import{P as de}from"./printer-BL_Sp8gN.js";import{M as ce}from"./mail-Dxv8ICTQ.js";import{R as pe}from"./receipt-BIzgJh7t.js";import"./index-CiirERUJ.js";import"./Combination-CjkdAK5r.js";function De(){var k,D,$,S,C,I,P;const[,h]=G(),{toast:f}=J(),{user:M}=W();K();const[d,v]=l.useState(""),[i,j]=l.useState(""),[n,w]=l.useState(""),[a,N]=l.useState(null),[B,m]=l.useState(!1),[me,U]=l.useState(!1),[y,F]=l.useState(!1),{data:x,isLoading:H}=X({queryKey:["/api/passenger/invoices"]}),O=_({mutationFn:async({id:t})=>{const s=await fetch(`/api/passenger/invoices/${t}/email`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include"});if(!s.ok){const r=await s.json();throw new Error(r.message||"Failed to send email")}return s.json()},onSuccess:()=>{f({title:"Email Sent",description:"Invoice has been sent to your email address"}),U(!1)},onError:t=>{f({title:"Error",description:t.message||"Failed to send invoice email",variant:"destructive"})}}),A=(x==null?void 0:x.filter(t=>{var c,L;const s=!d||t.invoiceNumber.toLowerCase().includes(d.toLowerCase())||((L=(c=t.booking)==null?void 0:c.pickupAddress)==null?void 0:L.toLowerCase().includes(d.toLowerCase())),r=new Date(t.createdAt),o=!i||r>=new Date(i),g=!n||r<=new Date(n+"T23:59:59");return s&&o&&g}))||[],R=d||i||n,V=()=>{v(""),j(""),w("")},q=t=>{N(t),m(!0)},Q=t=>{N(t),F(!0),O.mutate({id:t.id},{onSettled:()=>{F(!1)}})},Y=async t=>{let s=t.booking;const r=window.open("","_blank");if(!r)return;let o="";if(s!=null&&s.baseFare&&(o+=`
        <div class="pricing-row">
          <span class="pricing-label">Base Fare</span>
          <span class="pricing-value">$${parseFloat(s.baseFare).toFixed(2)}</span>
        </div>
      `),s!=null&&s.surgePricingAmount&&parseFloat(s.surgePricingAmount)>0){const c=s.surgePricingMultiplier?` (${s.surgePricingMultiplier}x)`:"";o+=`
        <div class="pricing-row">
          <span class="pricing-label">Surge Pricing${c}</span>
          <span class="pricing-value pricing-surge">+$${parseFloat(s.surgePricingAmount).toFixed(2)}</span>
        </div>
      `}if(s!=null&&s.gratuityAmount&&parseFloat(s.gratuityAmount)>0&&(o+=`
        <div class="pricing-row">
          <span class="pricing-label">Gratuity (Tip)</span>
          <span class="pricing-value">+$${parseFloat(s.gratuityAmount).toFixed(2)}</span>
        </div>
      `),s!=null&&s.airportFeeAmount&&parseFloat(s.airportFeeAmount)>0&&(o+=`
        <div class="pricing-row">
          <span class="pricing-label">Airport Fee</span>
          <span class="pricing-value">+$${parseFloat(s.airportFeeAmount).toFixed(2)}</span>
        </div>
      `),s!=null&&s.discountAmount&&parseFloat(s.discountAmount)>0){const c=s.discountPercentage?` (${s.discountPercentage}%)`:"";o+=`
        <div class="pricing-row">
          <span class="pricing-label">Discount${c}</span>
          <span class="pricing-value pricing-discount">-$${parseFloat(s.discountAmount).toFixed(2)}</span>
        </div>
      `}const g=`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${t.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 48px; 
            max-width: 850px; 
            margin: 0 auto;
            background: #ffffff;
            color: #0f172a;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 24px; 
            margin-bottom: 40px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 32px;
            border-radius: 12px;
          }
          .header h1 { 
            font-size: 36px;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          .header .invoice-number { 
            font-size: 18px;
            color: #4f46e5;
            font-weight: 600;
            margin-top: 12px;
          }
          .info-section {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          .info-section h2 {
            font-size: 16px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 600;
          }
          .booking-id {
            font-family: 'Courier New', monospace;
            background: #cbd5e1;
            padding: 4px 12px;
            border-radius: 6px;
            display: inline-block;
          }
          .pricing-section {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
          }
          .pricing-section h2 {
            font-size: 16px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .pricing-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .pricing-row:last-child {
            border-bottom: none;
          }
          .pricing-label {
            font-size: 15px;
            color: #0f172a;
            font-weight: 500;
          }
          .pricing-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 600;
          }
          .pricing-surge {
            color: #ea580c;
          }
          .pricing-discount {
            color: #16a34a;
          }
          .total-section {
            background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
            border: 3px solid #3b82f6;
            border-radius: 12px;
            padding: 24px;
            margin-top: 24px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-label {
            font-size: 20px;
            color: #0f172a;
            font-weight: 700;
          }
          .total-value {
            font-size: 28px;
            color: #1d4ed8;
            font-weight: 800;
          }
          .payment-status {
            text-align: center;
            margin-top: 32px;
            padding: 20px;
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
            border: 3px solid #10b981;
            border-radius: 12px;
          }
          .payment-status-text {
            color: #065f46;
            font-weight: 800;
            font-size: 20px;
            letter-spacing: 2px;
          }
          .footer {
            margin-top: 48px;
            padding-top: 24px;
            border-top: 2px solid #e2e8f0;
            text-align: center;
          }
          .footer p {
            color: #64748b;
            font-size: 13px;
            font-weight: 500;
          }
          .footer .thank-you {
            font-size: 16px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
          }
          @media print {
            body { 
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>USA Luxury Limo</h1>
          <div class="invoice-number">Invoice #${t.invoiceNumber}</div>
        </div>
        
        <div class="info-section">
          <h2>Invoice Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Invoice Date</span>
              <span class="info-value">${new Date(t.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Booking ID</span>
              <span class="info-value booking-id">#${t.bookingId.toUpperCase().substring(0,8)}</span>
            </div>
            ${t.paidAt?`
              <div class="info-item">
                <span class="info-label">Payment Date</span>
                <span class="info-value">${new Date(t.paidAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>
              </div>
            `:""}
          </div>
        </div>
        
        ${s?`
        <div class="info-section">
          <h2>🚗 Journey Information</h2>
          <div class="info-grid">
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">From :</span>
              <span class="info-value">${s.pickupAddress}</span>
            </div>
            ${s.bookingType==="hourly"&&s.requestedHours?`
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">Duration:</span>
              <span class="info-value">${s.requestedHours} ${s.requestedHours===1?"Hour":"Hours"}</span>
            </div>
            `:s.destinationAddress?`
            <div class="info-item" style="grid-column: span 2;">
              <span class="info-label">Destination:</span>
              <span class="info-value">${s.destinationAddress}</span>
            </div>
            `:""}
          </div>
        </div>
        `:""}
        
        <div class="pricing-section">
          <h2>📋 Detailed Pricing Breakdown</h2>
          ${o||`
            <div class="pricing-row">
              <span class="pricing-label">Journey Fare</span>
              <span class="pricing-value">$${parseFloat(t.subtotal).toFixed(2)}</span>
            </div>
          `}
          
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Total Amount</span>
              <span class="total-value">$${parseFloat(t.totalAmount).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        ${t.paidAt?`
          <div class="payment-status">
            <div class="payment-status-text">✓ PAYMENT RECEIVED</div>
          </div>
        `:""}
        
        <div class="footer">
          <p class="thank-you">Thank you for choosing USA Luxury Limo!</p>
          <p>All prices include statutory taxes and transportation expenses</p>
        </div>
        
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        <\/script>
      </body>
      </html>
    `;r.document.write(g),r.document.close()};return M?e.jsxs("div",{className:"min-h-screen bg-gradient-to-b from-blue-50 to-white pb-6",children:[e.jsx("div",{className:"bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8 rounded-b-3xl shadow-lg",children:e.jsxs("div",{className:"flex items-center gap-3 mb-4",children:[e.jsx(p,{variant:"ghost",size:"icon",onClick:()=>h("/mobile-passenger"),className:"text-white hover:bg-primary-foreground/20 dark:bg-primary-foreground/25","data-testid":"button-back",children:e.jsx(ne,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"My Invoices"}),e.jsx("p",{className:"text-blue-100 text-sm mt-1",children:"View and manage your ride invoices"})]})]})}),e.jsx("div",{className:"px-4 -mt-6 mb-4",children:e.jsxs("div",{className:"relative",children:[e.jsx(re,{className:"absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"}),e.jsx(u,{type:"text",placeholder:"Search by invoice number or address...",value:d,onChange:t=>v(t.target.value),className:"pl-10 h-12 bg-white shadow-md border-slate-200 focus:border-blue-500 focus:ring-blue-500","data-testid":"input-search"})]})}),e.jsx("div",{className:"px-4 mb-6",children:e.jsxs("div",{className:"bg-white shadow-md rounded-lg p-4 border border-slate-200",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(oe,{className:"w-4 h-4 text-blue-600"}),e.jsx("span",{className:"text-sm font-semibold text-slate-900",children:"Filter by Date"})]}),R&&e.jsxs(p,{size:"sm",variant:"ghost",onClick:V,className:"h-7 px-2 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50","data-testid":"button-clear-filters",children:[e.jsx(Z,{className:"w-3 h-3 mr-1"}),"Clear"]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx(T,{htmlFor:"start-date",className:"text-xs text-slate-600 mb-1.5 block",children:"From"}),e.jsx(u,{id:"start-date",type:"date",value:i,onChange:t=>j(t.target.value),className:"h-9 text-sm border-slate-300","data-testid":"input-start-date"})]}),e.jsxs("div",{children:[e.jsx(T,{htmlFor:"end-date",className:"text-xs text-slate-600 mb-1.5 block",children:"To"}),e.jsx(u,{id:"end-date",type:"date",value:n,onChange:t=>w(t.target.value),className:"h-9 text-sm border-slate-300","data-testid":"input-end-date"})]})]}),(i||n)&&e.jsxs("p",{className:"text-xs text-slate-500 mt-2 flex items-center gap-1",children:[e.jsx("span",{children:"📅"}),i&&n?e.jsxs("span",{children:["Showing invoices from ",new Date(i).toLocaleDateString()," to ",new Date(n).toLocaleDateString()]}):i?e.jsxs("span",{children:["Showing invoices from ",new Date(i).toLocaleDateString()," onwards"]}):e.jsxs("span",{children:["Showing invoices up to ",new Date(n).toLocaleDateString()]})]})]})}),e.jsx("div",{className:"px-4 space-y-3",children:H?e.jsxs("div",{className:"text-center py-12",children:[e.jsx("div",{className:"animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"}),e.jsx("p",{className:"text-slate-600 mt-4",children:"Loading invoices..."})]}):A.length===0?e.jsx(E,{className:"border-slate-200 bg-white shadow-md",children:e.jsx(z,{className:"p-12",children:e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",children:e.jsx(b,{className:"w-8 h-8 text-blue-600"})}),e.jsx("h3",{className:"text-lg font-semibold mb-2 text-slate-900",children:"No invoices found"}),e.jsx("p",{className:"text-sm text-slate-600",children:d?"Try adjusting your search terms":"Invoices will appear here once your rides are complete"})]})})}):A.map(t=>e.jsx(E,{className:"border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow",children:e.jsx(z,{className:"p-0",children:e.jsxs("div",{className:"p-3 space-y-2",children:[e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-slate-900 text-sm","data-testid":`invoice-number-${t.id}`,children:t.invoiceNumber}),e.jsx("p",{className:"text-xs text-slate-600","data-testid":`invoice-date-${t.id}`,children:new Date(t.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("p",{className:"text-lg font-bold text-blue-700","data-testid":`invoice-amount-${t.id}`,children:["$",parseFloat(t.totalAmount).toFixed(2)]}),e.jsx("span",{className:`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${t.paidAt?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}`,"data-testid":`invoice-status-${t.id}`,children:t.paidAt?"Paid":"Unpaid"})]})]}),t.booking&&e.jsxs("div",{className:"text-xs space-y-0.5",children:[e.jsxs("p",{className:"text-slate-600 leading-tight",children:[e.jsx("span",{className:"font-medium text-slate-900",children:"From:"})," ",t.booking.pickupAddress]}),t.booking.destinationAddress&&e.jsxs("p",{className:"text-slate-600 leading-tight",children:[e.jsx("span",{className:"font-medium text-slate-900",children:"To:"})," ",t.booking.destinationAddress]}),e.jsxs("p",{className:"text-slate-600 leading-tight",children:[e.jsx("span",{className:"font-medium text-slate-900",children:"ID:"})," #",t.bookingId.toUpperCase().substring(0,8)]})]}),e.jsxs("div",{className:"flex gap-1.5 pt-2 border-t border-slate-100",children:[e.jsxs(p,{size:"sm",variant:"outline",onClick:()=>q(t),className:"flex-1 h-7 text-indigo-700 border-indigo-300 hover:bg-indigo-50 text-[10px] px-1","data-testid":`button-view-${t.id}`,children:[e.jsx(le,{className:"w-3 h-3 mr-0.5"}),"View"]}),e.jsxs(p,{size:"sm",variant:"outline",onClick:()=>Y(t),className:"flex-1 h-7 text-slate-700 border-slate-300 hover:bg-slate-50 text-[10px] px-1","data-testid":`button-print-${t.id}`,children:[e.jsx(de,{className:"w-3 h-3 mr-0.5"}),"Print"]}),e.jsxs(p,{size:"sm",variant:"outline",onClick:()=>Q(t),disabled:y,className:"flex-1 h-7 text-blue-700 border-blue-300 hover:bg-blue-50 text-[10px] px-1","data-testid":`button-email-${t.id}`,children:[e.jsx(ce,{className:"w-3 h-3 mr-0.5"}),y?"...":"Email"]})]})]})})},t.id))}),e.jsx(ee,{open:B,onOpenChange:m,children:e.jsxs(te,{className:"sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto",children:[e.jsx(se,{className:"border-b border-slate-200 pb-4",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg",children:e.jsx(b,{className:"w-5 h-5 text-white"})}),e.jsxs("div",{children:[e.jsx(ae,{className:"text-xl font-bold text-slate-900",children:"Invoice Details"}),e.jsx("p",{className:"text-sm text-slate-600 mt-0.5",children:"Complete pricing breakdown"})]})]})}),a&&e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"bg-gradient-to-br from-slate-50 to-slate-100/50 p-5 rounded-xl border border-slate-200",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-4",children:[e.jsx("div",{className:"bg-indigo-100 p-1.5 rounded-lg",children:e.jsx(b,{className:"w-4 h-4 text-indigo-700"})}),e.jsx("h3",{className:"font-bold text-lg text-slate-900",children:"Invoice Information"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-x-8 gap-y-4 text-sm",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-slate-600 mb-1.5 font-medium",children:"Invoice Number"}),e.jsx("p",{className:"font-bold text-slate-900","data-testid":"view-invoice-number",children:a.invoiceNumber})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-slate-600 mb-1.5 font-medium",children:"Date"}),e.jsx("p",{className:"text-slate-900","data-testid":"view-invoice-date",children:new Date(a.createdAt).toLocaleDateString()})]}),e.jsxs("div",{className:"col-span-2",children:[e.jsx("p",{className:"text-slate-600 mb-1.5 font-medium",children:"Booking ID"}),e.jsxs("p",{className:"font-mono text-sm bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg inline-block","data-testid":"view-booking-id",children:["#",a.bookingId.toUpperCase().substring(0,8)]})]}),a.paidAt&&e.jsxs("div",{className:"col-span-2",children:[e.jsx("p",{className:"text-slate-600 mb-1.5 font-medium",children:"Payment Date"}),e.jsx("p",{className:"text-slate-900","data-testid":"view-payment-date",children:new Date(a.paidAt).toLocaleDateString()})]})]})]}),e.jsxs("div",{className:"bg-white border border-slate-200 rounded-xl p-5",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-4",children:[e.jsx("div",{className:"bg-blue-100 p-1.5 rounded-lg",children:e.jsx(pe,{className:"w-4 h-4 text-blue-700"})}),e.jsx("h3",{className:"font-bold text-lg text-slate-900",children:"Detailed Pricing Breakdown"})]}),e.jsxs("div",{className:"space-y-3",children:[((k=a.booking)==null?void 0:k.baseFare)&&e.jsxs("div",{className:"flex justify-between items-center py-2.5 border-b border-slate-100",children:[e.jsx("span",{className:"text-slate-900 font-medium",children:"Base Fare"}),e.jsxs("span",{className:"font-semibold text-slate-900","data-testid":"view-base-fare",children:["$",parseFloat(a.booking.baseFare).toFixed(2)]})]}),((D=a.booking)==null?void 0:D.surgePricingAmount)&&parseFloat(a.booking.surgePricingAmount)>0&&e.jsxs("div",{className:"flex justify-between items-center py-2.5 border-b border-slate-100",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-slate-900 font-medium",children:"Surge Pricing"}),(($=a.booking)==null?void 0:$.surgePricingMultiplier)&&e.jsxs("span",{className:"text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold",children:[a.booking.surgePricingMultiplier,"x"]})]}),e.jsxs("span",{className:"font-semibold text-orange-600","data-testid":"view-surge-pricing",children:["+$",parseFloat(a.booking.surgePricingAmount).toFixed(2)]})]}),((S=a.booking)==null?void 0:S.gratuityAmount)&&parseFloat(a.booking.gratuityAmount)>0&&e.jsxs("div",{className:"flex justify-between items-center py-2.5 border-b border-slate-100",children:[e.jsx("span",{className:"text-slate-900 font-medium",children:"Gratuity (Tip)"}),e.jsxs("span",{className:"font-semibold text-slate-900","data-testid":"view-gratuity",children:["+$",parseFloat(a.booking.gratuityAmount).toFixed(2)]})]}),((C=a.booking)==null?void 0:C.airportFeeAmount)&&parseFloat(a.booking.airportFeeAmount)>0&&e.jsxs("div",{className:"flex justify-between items-center py-2.5 border-b border-slate-100",children:[e.jsx("span",{className:"text-slate-900 font-medium",children:"Airport Fee"}),e.jsxs("span",{className:"font-semibold text-slate-900","data-testid":"view-airport-fee",children:["+$",parseFloat(a.booking.airportFeeAmount).toFixed(2)]})]}),((I=a.booking)==null?void 0:I.discountAmount)&&parseFloat(a.booking.discountAmount)>0&&e.jsxs("div",{className:"flex justify-between items-center py-2.5 border-b border-slate-100",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-slate-900 font-medium",children:"Discount"}),((P=a.booking)==null?void 0:P.discountPercentage)&&e.jsxs("span",{className:"text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold",children:[a.booking.discountPercentage,"%"]})]}),e.jsxs("span",{className:"font-semibold text-green-600","data-testid":"view-discount",children:["-$",parseFloat(a.booking.discountAmount).toFixed(2)]})]}),e.jsxs("div",{className:"flex justify-between items-center py-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 -mx-4 rounded-lg mt-3 border-t-2 border-blue-200",children:[e.jsx("span",{className:"font-bold text-lg text-slate-900",children:"Total Amount"}),e.jsxs("span",{className:"font-bold text-xl text-blue-700","data-testid":"view-total",children:["$",parseFloat(a.totalAmount).toFixed(2)]})]})]})]}),a.paidAt&&e.jsx("div",{className:"text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl",children:e.jsxs("div",{className:"flex items-center justify-center gap-2",children:[e.jsx("div",{className:"bg-green-600 p-1.5 rounded-full",children:e.jsx("svg",{className:"w-4 h-4 text-white",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M5 13l4 4L19 7"})})}),e.jsx("p",{className:"text-green-800 font-bold text-lg",children:"PAYMENT RECEIVED"})]})}),e.jsx("div",{className:"text-xs text-slate-500 text-center pt-2 bg-slate-50 py-3 rounded-lg border border-slate-200",children:e.jsx("p",{className:"font-medium",children:"💡 All prices include statutory taxes and transportation expenses"})})]}),e.jsx(ie,{className:"border-t border-slate-200 pt-4",children:e.jsx(p,{variant:"outline",onClick:()=>m(!1),className:"border-slate-300 text-slate-700 hover:bg-slate-50","data-testid":"button-close-view",children:"Close"})})]})})]}):(h("/mobile-login?role=passenger"),null)}export{De as default};
