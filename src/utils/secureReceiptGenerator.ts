// Secure receipt generation utility to prevent XSS attacks
// This replaces direct innerHTML usage with safe DOM manipulation

export interface ReceiptData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
}

export function createSecureReceipt(data: ReceiptData): HTMLElement {
  // Create main container
  const container = document.createElement('div');
  container.style.cssText = `
    font-family: 'Noto Sans KR', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 30px;
    border: 1px solid #ddd;
    background: white;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px;';
  
  const title = document.createElement('h1');
  title.style.cssText = 'color: #4F46E5; margin: 0; font-size: 28px; font-weight: bold;';
  title.textContent = '구매 영수증';
  
  const subtitle = document.createElement('p');
  subtitle.style.cssText = 'color: #666; margin: 5px 0 0 0; font-size: 14px;';
  subtitle.textContent = 'PURCHASE RECEIPT';
  
  header.appendChild(title);
  header.appendChild(subtitle);

  // Order info
  const orderInfo = document.createElement('div');
  orderInfo.style.cssText = 'margin-bottom: 30px;';
  
  const orderNumber = document.createElement('p');
  orderNumber.style.cssText = 'margin: 5px 0; font-size: 14px;';
  orderNumber.innerHTML = `<strong>주문번호:</strong> ${escapeHtml(data.orderNumber)}`;
  
  const customerName = document.createElement('p');
  customerName.style.cssText = 'margin: 5px 0; font-size: 14px;';
  customerName.innerHTML = `<strong>구매자:</strong> ${escapeHtml(data.customerName)}`;
  
  const customerEmail = document.createElement('p');
  customerEmail.style.cssText = 'margin: 5px 0; font-size: 14px;';
  customerEmail.innerHTML = `<strong>이메일:</strong> ${escapeHtml(data.customerEmail)}`;
  
  const orderDate = document.createElement('p');
  orderDate.style.cssText = 'margin: 5px 0; font-size: 14px;';
  orderDate.innerHTML = `<strong>주문일시:</strong> ${escapeHtml(data.orderDate)}`;
  
  orderInfo.appendChild(orderNumber);
  orderInfo.appendChild(customerName);
  orderInfo.appendChild(customerEmail);
  orderInfo.appendChild(orderDate);

  // Items table
  const table = document.createElement('table');
  table.style.cssText = 'width: 100%; border-collapse: collapse; margin-bottom: 20px;';
  
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.style.cssText = 'background-color: #f8f9fa;';
  
  const headers = ['강의명', '수량', '가격'];
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.style.cssText = 'padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold;';
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  data.items.forEach(item => {
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.style.cssText = 'padding: 12px; border: 1px solid #ddd;';
    nameCell.textContent = item.name;
    
    const quantityCell = document.createElement('td');
    quantityCell.style.cssText = 'padding: 12px; border: 1px solid #ddd; text-align: center;';
    quantityCell.textContent = (item.quantity || 1).toString();
    
    const priceCell = document.createElement('td');
    priceCell.style.cssText = 'padding: 12px; border: 1px solid #ddd; text-align: right;';
    priceCell.textContent = `${item.price.toLocaleString()}원`;
    
    row.appendChild(nameCell);
    row.appendChild(quantityCell);
    row.appendChild(priceCell);
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);

  // Total
  const totalRow = document.createElement('div');
  totalRow.style.cssText = 'text-align: right; margin-top: 20px; padding-top: 20px; border-top: 2px solid #4F46E5;';
  
  const totalText = document.createElement('h3');
  totalText.style.cssText = 'margin: 0; color: #4F46E5; font-size: 20px;';
  totalText.textContent = `총 결제금액: ${data.totalAmount.toLocaleString()}원`;
  
  const paymentMethod = document.createElement('p');
  paymentMethod.style.cssText = 'margin: 10px 0 0 0; font-size: 14px; color: #666;';
  paymentMethod.textContent = `결제수단: ${data.paymentMethod}`;
  
  totalRow.appendChild(totalText);
  totalRow.appendChild(paymentMethod);

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = 'margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;';
  
  const footerText1 = document.createElement('p');
  footerText1.textContent = '본 영수증은 전자상거래 결제 완료를 증명하는 서류입니다.';
  
  const footerText2 = document.createElement('p');
  footerText2.textContent = `발행일: ${new Date().toLocaleString('ko-KR')}`;
  
  footer.appendChild(footerText1);
  footer.appendChild(footerText2);

  // Assemble everything
  container.appendChild(header);
  container.appendChild(orderInfo);
  container.appendChild(table);
  container.appendChild(totalRow);
  container.appendChild(footer);

  return container;
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}