
/**
 * Utility functions for receipt printing
 */

/**
 * Prints a receipt directly from the browser by opening a new window
 * with formatted HTML content ready for printing
 */
export const printReceiptFromBrowser = (
  items: Array<{
    product: { name: string; price: number };
    quantity: number;
    totalPrice: number;
    selectedAddons: Array<{ name: string; price: number }>;
  }>,
  totalAmount: number,
  paymentInfo: {
    method: "cash" | "credit" | "debit" | "pix";
    cashReceived?: number;
    change?: number;
  },
  storeInfo: {
    name: string;
    customerName?: string;
    orderNumber?: number;
  }
) => {
  // Generate the receipt content
  const date = new Date();
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();
  
  let receiptContent = `
       ${storeInfo.name}
--------------------------
Data: ${formattedDate} ${formattedTime}
${storeInfo.customerName ? `Cliente: ${storeInfo.customerName}\n` : ''}
${storeInfo.orderNumber ? `Pedido #${storeInfo.orderNumber}\n` : ''}
--------------------------
`;

  // Add items to receipt
  items.forEach(item => {
    // Format the quantity and price with proper spacing
    const quantityStr = `${item.quantity}x`;
    const itemName = item.product.name;
    const itemPrice = `R$${item.totalPrice.toFixed(2).replace('.', ',')}`;
    
    // Calculate spaces to align the price to the right
    const totalWidth = 40; // Total characters in a line
    const contentWidth = quantityStr.length + 1 + itemName.length;
    const spacesNeeded = Math.max(1, totalWidth - contentWidth - itemPrice.length);
    const spaces = ' '.repeat(spacesNeeded);
    
    receiptContent += `${quantityStr} ${itemName}${spaces}${itemPrice}\n`;
    
    // Add addons if any
    if (item.selectedAddons.length > 0) {
      item.selectedAddons.forEach(addon => {
        const addonName = `  + ${addon.name}`;
        const addonPrice = `R$${addon.price.toFixed(2).replace('.', ',')}`;
        const addonSpaces = ' '.repeat(Math.max(1, totalWidth - addonName.length - addonPrice.length));
        receiptContent += `${addonName}${addonSpaces}${addonPrice}\n`;
      });
    }
  });
  
  // Add total and payment info
  receiptContent += `--------------------------
TOTAL:             R$${totalAmount.toFixed(2).replace('.', ',')}
--------------------------
Forma de pagamento: ${
    paymentInfo.method === "cash" ? "Dinheiro" :
    paymentInfo.method === "credit" ? "Cartão de Crédito" :
    paymentInfo.method === "debit" ? "Cartão de Débito" : "PIX"
  }
`;

  // Add cash received and change if applicable
  if (paymentInfo.method === "cash" && paymentInfo.cashReceived) {
    receiptContent += `Valor recebido:      R$${paymentInfo.cashReceived.toFixed(2).replace('.', ',')}
Troco:             R$${(paymentInfo.change || 0).toFixed(2).replace('.', ',')}
`;
  }

  receiptContent += `--------------------------
Obrigado pela preferência!
@acaizenn | @açaizen
`;

  // Create the HTML content for the receipt
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cupom - ${storeInfo.name}</title>
  <style>
    body {
      font-family: monospace;
      font-size: 12px;
      padding: 20px;
      margin: 0;
      width: 300px;
    }
    @media print {
      body {
        width: 100%;
      }
    }
    pre {
      white-space: pre-wrap;
    }
  </style>
</head>
<body onload="window.print()" onafterprint="window.close()">
  <pre>${receiptContent}</pre>
  <script>
    // If user cancels print, close the window after a delay
    setTimeout(() => {
      if (document.readyState === 'complete') {
        window.close();
      }
    }, 5000);
  </script>
</body>
</html>
  `;

  // Open a new window and write the HTML content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
  
  return true;
};
