/**
 * Função utilitária para imprimir cupom direto pelo navegador
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
  const date = new Date();
  const formattedDate = date.toLocaleDateString("pt-BR");
  const formattedTime = date.toLocaleTimeString("pt-BR");

  let receiptContent = `
       ${storeInfo.name}
--------------------------
Data: ${formattedDate} ${formattedTime}
${storeInfo.customerName ? `Cliente: ${storeInfo.customerName}\n` : ""}
${storeInfo.orderNumber ? `Pedido #${storeInfo.orderNumber}\n` : ""}
--------------------------
`;

  // Produtos e adicionais
  items.forEach((item) => {
    const quantityStr = `${item.quantity}x`;
    const itemName = item.product.name;
    const itemPrice = `R$${item.totalPrice.toFixed(2).replace(".", ",")}`;

    const totalWidth = 40;
    const contentWidth = quantityStr.length + 1 + itemName.length;
    const spaces = " ".repeat(Math.max(1, totalWidth - contentWidth - itemPrice.length));

    receiptContent += `${quantityStr} ${itemName}${spaces}${itemPrice}\n`;

    if (item.selectedAddons?.length > 0) {
      item.selectedAddons.forEach((addon) => {
        const addonName = `  + ${addon.name}`;
        const addonPrice = `R$${addon.price.toFixed(2).replace(".", ",")}`;
        const addonSpaces = " ".repeat(Math.max(1, totalWidth - addonName.length - addonPrice.length));
        receiptContent += `${addonName}${addonSpaces}${addonPrice}\n`;
      });
    }
  });

  // Pagamento
  receiptContent += `--------------------------
TOTAL:             R$${totalAmount.toFixed(2).replace(".", ",")}
--------------------------
Forma de pagamento: ${
    paymentInfo.method === "cash"
      ? "Dinheiro"
      : paymentInfo.method === "credit"
      ? "Cartão de Crédito"
      : paymentInfo.method === "debit"
      ? "Cartão de Débito"
      : "PIX"
  }
`;

  if (paymentInfo.method === "cash" && paymentInfo.cashReceived != null) {
    receiptContent += `Valor recebido:      R$${paymentInfo.cashReceived.toFixed(2).replace(".", ",")}
Troco:             R$${(paymentInfo.change || 0).toFixed(2).replace(".", ",")}
`;
  }

  receiptContent += `--------------------------
Obrigado pela preferência!
@acaizenn | @açaizen
`;

  // HTML para impressão
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
    setTimeout(() => {
      if (document.readyState === 'complete') {
        window.close();
      }
    }, 5000);
  </script>
</body>
</html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  return true;
};
