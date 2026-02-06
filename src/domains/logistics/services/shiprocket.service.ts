/**
 * Shiprocket service - Integration with Shiprocket API
 */

// Lazy load env to avoid validation errors
function getShiprocketConfig() {
  try {
    const { env } = require('@/lib/env');
    return {
      email: env.SHIPROCKET_EMAIL || process.env.SHIPROCKET_EMAIL,
      password: env.SHIPROCKET_PASSWORD || process.env.SHIPROCKET_PASSWORD,
      baseUrl: env.SHIPROCKET_BASE_URL || process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
    };
  } catch {
    return {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
      baseUrl: process.env.SHIPROCKET_BASE_URL || 'https://apiv2.shiprocket.in/v1/external',
    };
  }
}

export class ShiprocketService {
  private baseUrl: string;
  private email: string;
  private password: string;
  private authToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    const config = getShiprocketConfig();
    this.baseUrl = config.baseUrl || 'https://apiv2.shiprocket.in/v1/external';
    this.email = config.email || '';
    this.password = config.password || '';
  }

  /**
   * Authenticate with Shiprocket and get token
   */
  private async authenticate(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.authToken && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.authToken;
    }

    if (!this.email || !this.password) {
      throw new Error('Shiprocket credentials not configured. Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Shiprocket authentication failed: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000);
      
      if (!this.authToken) {
        throw new Error('Failed to get authentication token');
      }
      return this.authToken;
    } catch (error: any) {
      throw new Error(`Failed to authenticate with Shiprocket: ${error.message}`);
    }
  }

  /**
   * Get authenticated headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Check pincode serviceability
   */
  async checkServiceability(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number = 500, // Default 500g
    codAmount?: number
  ): Promise<any> {
    const headers = await this.getAuthHeaders();
    
    const params = new URLSearchParams({
      pickup_pincode: pickupPincode,
      delivery_pincode: deliveryPincode,
      weight: weight.toString(),
    });

    if (codAmount) {
      params.append('cod', '1');
    }

    try {
      const response = await fetch(`${this.baseUrl}/courier/serviceability/?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Serviceability check failed: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to check serviceability: ${error.message}`);
    }
  }

  /**
   * Create order in Shiprocket
   */
  async createOrder(orderData: {
    order_id: string;
    order_date: string;
    pickup_location: string;
    billing_customer_name: string;
    billing_last_name: string;
    billing_address: string;
    billing_address_2: string;
    billing_city: string;
    billing_pincode: string;
    billing_state: string;
    billing_country: string;
    billing_email: string;
    billing_phone: string;
    shipping_is_billing: boolean;
    shipping_customer_name: string;
    shipping_last_name: string;
    shipping_address: string;
    shipping_address_2: string;
    shipping_city: string;
    shipping_pincode: string;
    shipping_state: string;
    shipping_country: string;
    shipping_email: string;
    shipping_phone: string;
    order_items: Array<{
      name: string;
      sku: string;
      units: number;
      selling_price: number;
    }>;
    payment_method: string;
    sub_total: number;
    length: number;
    breadth: number;
    height: number;
    weight: number;
  }): Promise<any> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/orders/create/adhoc`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create Shiprocket order: ${error.message || JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to create Shiprocket order: ${error.message}`);
    }
  }

  /**
   * Create shipment
   */
  async createShipment(shipmentId: number, courierId?: number): Promise<any> {
    const headers = await this.getAuthHeaders();

    const payload: any = {
      shipment_id: shipmentId,
    };

    if (courierId) {
      payload.courier_id = courierId;
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders/create/adhoc/shipment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create shipment: ${error.message || JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to create shipment: ${error.message}`);
    }
  }

  /**
   * Get shipment tracking
   */
  async getTracking(awbCode: string): Promise<any> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/courier/track/awb/${awbCode}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get tracking: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to get tracking: ${error.message}`);
    }
  }

  /**
   * Get shipment by ID
   */
  async getShipment(shipmentId: number): Promise<any> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/orders/show/${shipmentId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get shipment: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to get shipment: ${error.message}`);
    }
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(awbCode: string): Promise<any> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/orders/cancel/shipment/awbs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          awbs: [awbCode],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to cancel shipment: ${error.message || JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to cancel shipment: ${error.message}`);
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentIds: number[]): Promise<any> {
    const headers = await this.getAuthHeaders();

    try {
      const response = await fetch(`${this.baseUrl}/orders/print/invoice`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shipment_ids: shipmentIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to generate label: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(`Failed to generate label: ${error.message}`);
    }
  }
}

