/**
 * Email Templates Service - Generates HTML email templates
 */

export interface WelcomeEmailData {
  name: string;
  email: string;
}

export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod: string;
  orderStatus: string;
}

export class EmailTemplatesService {
  /**
   * Generate welcome email template
   */
  static generateWelcomeEmail(data: WelcomeEmailData): { html: string; text: string } {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Nextin Jewellery</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center; background-color: #1a1a1a;">
                <h1 style="color: #d4af37; margin: 0; font-size: 28px;">Nextin Jewellery</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 20px; background-color: #ffffff; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; margin-top: 0;">Welcome, ${data.name}!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Thank you for joining Nextin Jewellery! We're thrilled to have you as part of our community.
                </p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Your account has been successfully created with the email: <strong>${data.email}</strong>
                </p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  You can now:
                </p>
                <ul style="color: #666; font-size: 16px; line-height: 1.8;">
                  <li>Browse our exquisite collection of jewellery</li>
                  <li>Save items to your wishlist</li>
                  <li>Track your orders</li>
                  <li>Manage your account settings</li>
                </ul>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop" 
                     style="display: inline-block; padding: 12px 30px; background-color: #d4af37; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    Start Shopping
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                  If you have any questions, feel free to contact our support team.
                </p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  Best regards,<br>
                  <strong>The Nextin Jewellery Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #1a1a1a; color: #999; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Nextin Jewellery. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const text = `
Welcome to Nextin Jewellery!

Thank you for joining Nextin Jewellery! We're thrilled to have you as part of our community.

Your account has been successfully created with the email: ${data.email}

You can now:
- Browse our exquisite collection of jewellery
- Save items to your wishlist
- Track your orders
- Manage your account settings

Visit our shop: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop

If you have any questions, feel free to contact our support team.

Best regards,
The Nextin Jewellery Team

© ${new Date().getFullYear()} Nextin Jewellery. All rights reserved.
This is an automated email, please do not reply.
    `.trim();

    return { html, text };
  }

  /**
   * Generate order confirmation email template
   */
  static generateOrderConfirmationEmail(data: OrderConfirmationEmailData): { html: string; text: string } {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    };

    const itemsHtml = data.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${item.productName}</strong>
        </td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
          ${formatCurrency(item.price)}
        </td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `
      )
      .join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - ${data.orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center; background-color: #1a1a1a;">
                <h1 style="color: #d4af37; margin: 0; font-size: 28px;">Nextin Jewellery</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 20px; background-color: #ffffff; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; margin-top: 0;">Order Confirmation</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Dear ${data.customerName},
                </p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  Thank you for your order! We've received your order and it's being processed.
                </p>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
                    Order Number: <span style="color: #d4af37;">${data.orderNumber}</span>
                  </p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Order Date: ${data.orderDate}
                  </p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Status: <strong>${data.orderStatus}</strong>
                  </p>
                </div>

                <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">Order Items</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                  <thead>
                    <tr style="background-color: #f9f9f9;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Product</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 5px 0; color: #666;">Subtotal:</td>
                      <td style="padding: 5px 0; text-align: right; color: #333; font-weight: bold;">
                        ${formatCurrency(data.subtotal)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #666;">Shipping:</td>
                      <td style="padding: 5px 0; text-align: right; color: #333; font-weight: bold;">
                        ${formatCurrency(data.shipping)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 5px 0; color: #666;">Tax:</td>
                      <td style="padding: 5px 0; text-align: right; color: #333; font-weight: bold;">
                        ${formatCurrency(data.tax)}
                      </td>
                    </tr>
                    <tr style="border-top: 2px solid #ddd; margin-top: 10px;">
                      <td style="padding: 10px 0; color: #333; font-size: 18px; font-weight: bold;">Total:</td>
                      <td style="padding: 10px 0; text-align: right; color: #d4af37; font-size: 18px; font-weight: bold;">
                        ${formatCurrency(data.total)}
                      </td>
                    </tr>
                  </table>
                </div>

                <div style="margin: 30px 0;">
                  <h3 style="color: #333; margin-bottom: 15px;">Shipping Address</h3>
                  <p style="color: #666; line-height: 1.8; margin: 0;">
                    ${data.shippingAddress.name}<br>
                    ${data.shippingAddress.address}<br>
                    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                    ${data.shippingAddress.country}
                    ${data.shippingAddress.phone ? `<br>Phone: ${data.shippingAddress.phone}` : ''}
                  </p>
                </div>

                <div style="margin: 30px 0;">
                  <p style="color: #666; margin: 0;">
                    <strong>Payment Method:</strong> ${data.paymentMethod}
                  </p>
                </div>

                <div style="margin: 30px 0; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account" 
                     style="display: inline-block; padding: 12px 30px; background-color: #d4af37; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    View Order Details
                  </a>
                </div>

                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                  We'll send you another email when your order ships. If you have any questions, please contact our support team.
                </p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  Best regards,<br>
                  <strong>The Nextin Jewellery Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #1a1a1a; color: #999; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Nextin Jewellery. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const text = `
Order Confirmation

Dear ${data.customerName},

Thank you for your order! We've received your order and it's being processed.

Order Number: ${data.orderNumber}
Order Date: ${data.orderDate}
Status: ${data.orderStatus}

Order Items:
${data.items.map((item) => `- ${item.productName} (Qty: ${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`).join('\n')}

Subtotal: ${formatCurrency(data.subtotal)}
Shipping: ${formatCurrency(data.shipping)}
Tax: ${formatCurrency(data.tax)}
Total: ${formatCurrency(data.total)}

Shipping Address:
${data.shippingAddress.name}
${data.shippingAddress.address}
${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}
${data.shippingAddress.phone ? `Phone: ${data.shippingAddress.phone}` : ''}

Payment Method: ${data.paymentMethod}

View your order: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account

We'll send you another email when your order ships. If you have any questions, please contact our support team.

Best regards,
The Nextin Jewellery Team

© ${new Date().getFullYear()} Nextin Jewellery. All rights reserved.
This is an automated email, please do not reply.
    `.trim();

    return { html, text };
  }

  /**
   * Generate order status update email template
   */
  static generateOrderStatusUpdateEmail(data: {
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    previousStatus: string;
    newStatus: string;
    orderDate: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
    }>;
    total: number;
    trackingUrl?: string;
    trackingNumber?: string;
  }): { html: string; text: string } {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
      }).format(amount);
    };

    // Status-specific messages
    const statusMessages: Record<string, { title: string; message: string; color: string }> = {
      CONFIRMED: {
        title: 'Order Confirmed',
        message: 'Great news! Your order has been confirmed and is being prepared for processing.',
        color: '#28a745',
      },
      PROCESSING: {
        title: 'Order Processing',
        message: 'Your order is now being processed and will be shipped soon.',
        color: '#17a2b8',
      },
      SHIPPED: {
        title: 'Order Shipped',
        message: 'Your order has been shipped! You can track your package using the tracking information below.',
        color: '#007bff',
      },
      DELIVERED: {
        title: 'Order Delivered',
        message: 'Your order has been delivered! We hope you love your purchase.',
        color: '#28a745',
      },
      CANCELLED: {
        title: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
        color: '#dc3545',
      },
      RETURNED: {
        title: 'Order Returned',
        message: 'Your order return has been processed. We will process your refund shortly.',
        color: '#ffc107',
      },
    };

    const statusInfo = statusMessages[data.newStatus] || {
      title: `Order ${data.newStatus}`,
      message: `Your order status has been updated to ${data.newStatus}.`,
      color: '#666',
    };

    const trackingSection = data.trackingUrl || data.trackingNumber
      ? `
                <div style="background-color: #e7f3ff; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #007bff;">
                  <h3 style="color: #333; margin-top: 0; margin-bottom: 10px;">Tracking Information</h3>
                  ${data.trackingNumber ? `<p style="margin: 5px 0; color: #666;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>` : ''}
                  ${data.trackingUrl ? `<p style="margin: 10px 0;"><a href="${data.trackingUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order</a></p>` : ''}
                </div>
              `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${statusInfo.title} - ${data.orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center; background-color: #1a1a1a;">
                <h1 style="color: #d4af37; margin: 0; font-size: 28px;">Nextin Jewellery</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 20px; background-color: #ffffff; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; padding: 15px 30px; background-color: ${statusInfo.color}; color: #ffffff; border-radius: 4px; font-size: 20px; font-weight: bold;">
                    ${statusInfo.title}
                  </div>
                </div>
                <h2 style="color: #333; margin-top: 0;">Hello ${data.customerName},</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">
                  ${statusInfo.message}
                </p>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">
                    Order Number: <span style="color: #d4af37;">${data.orderNumber}</span>
                  </p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Order Date: ${data.orderDate}
                  </p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                    Status: <strong style="color: ${statusInfo.color};">${data.newStatus}</strong>
                  </p>
                </div>
                ${trackingSection}
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account" 
                     style="display: inline-block; padding: 12px 30px; background-color: #d4af37; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">
                    View Order Details
                  </a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                  If you have any questions about your order, please contact our support team.
                </p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                  Best regards,<br>
                  <strong>The Nextin Jewellery Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #1a1a1a; color: #999; font-size: 12px;">
                <p style="margin: 0;">© ${new Date().getFullYear()} Nextin Jewellery. All rights reserved.</p>
                <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const text = `
${statusInfo.title}

Hello ${data.customerName},

${statusInfo.message}

Order Number: ${data.orderNumber}
Order Date: ${data.orderDate}
Status: ${data.newStatus}
${data.trackingNumber ? `Tracking Number: ${data.trackingNumber}` : ''}
${data.trackingUrl ? `Track Your Order: ${data.trackingUrl}` : ''}

View your order: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account

If you have any questions about your order, please contact our support team.

Best regards,
The Nextin Jewellery Team

© ${new Date().getFullYear()} Nextin Jewellery. All rights reserved.
This is an automated email, please do not reply.
    `.trim();

    return { html, text };
  }
}

