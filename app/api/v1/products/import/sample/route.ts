/**
 * GET /api/v1/products/import/sample - Download sample CSV file for product import (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { logger } from '@/src/shared/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/products/import/sample', ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Sample CSV data matching the exact format expected by the import route
    const sampleData = [
      {
        Name: 'Gold Diamond Ring',
        Slug: 'gold-diamond-ring',
        SKU: 'RING-001',
        Description: 'Beautiful gold ring with diamond centerpiece. Perfect for special occasions.',
        Price: '29999',
        'Original Price': '34999',
        'Main Image': '/img/product/ring-1.jpg',
        'Additional Images': '/img/product/ring-1-1.jpg; /img/product/ring-1-2.jpg',
        Category: 'Rings',
        Status: 'PUBLISHED',
        'In Stock': 'true',
        'Stock Quantity': '50',
        'Meta Title': 'Gold Diamond Ring - Premium Jewelry',
        'Meta Description': 'Shop our exquisite gold diamond ring collection. Handcrafted with precision.',
        'Meta Keywords': 'gold ring, diamond ring, jewelry, engagement ring',
        'OG Image': '/img/product/ring-1-og.jpg',
        'Weight (grams)': '5.2',
        Dimensions: '{"length":2,"width":2,"height":1,"unit":"cm"}',
        'Tax Class': 'standard',
        'Supplier Name': 'Premium Jewelers Inc.',
        'Supplier Location': 'Mumbai, India',
        'Supplier Certification': 'BIS Hallmark',
        'Return Policy': '30 days return policy with original packaging',
        'Return Days': '30',
        'Brand ID': '',
      },
      {
        Name: 'Silver Pearl Necklace',
        Slug: 'silver-pearl-necklace',
        SKU: 'NECK-002',
        Description: 'Elegant silver necklace with natural pearls. Timeless beauty for any occasion.',
        Price: '14999',
        'Original Price': '17999',
        'Main Image': '/img/product/necklace-1.jpg',
        'Additional Images': '/img/product/necklace-1-1.jpg',
        Category: 'Necklaces',
        Status: 'PUBLISHED',
        'In Stock': 'true',
        'Stock Quantity': '30',
        'Meta Title': 'Silver Pearl Necklace - Classic Elegance',
        'Meta Description': 'Discover our stunning silver pearl necklace collection.',
        'Meta Keywords': 'silver necklace, pearl necklace, jewelry',
        'OG Image': '',
        'Weight (grams)': '12.5',
        Dimensions: '',
        'Tax Class': 'standard',
        'Supplier Name': 'Classic Gems Ltd.',
        'Supplier Location': 'Delhi, India',
        'Supplier Certification': '',
        'Return Policy': '14 days return policy',
        'Return Days': '14',
        'Brand ID': '',
      },
      {
        Name: 'Platinum Wedding Band',
        Slug: 'platinum-wedding-band',
        SKU: 'BAND-003',
        Description: 'Premium platinum wedding band. Symbol of eternal love and commitment.',
        Price: '49999',
        'Original Price': '',
        'Main Image': '/img/product/band-1.jpg',
        'Additional Images': '',
        Category: 'Rings',
        Status: 'DRAFT',
        'In Stock': 'true',
        'Stock Quantity': '20',
        'Meta Title': '',
        'Meta Description': '',
        'Meta Keywords': '',
        'OG Image': '',
        'Weight (grams)': '8.0',
        Dimensions: '',
        'Tax Class': 'premium',
        'Supplier Name': '',
        'Supplier Location': '',
        'Supplier Certification': '',
        'Return Policy': '',
        'Return Days': '',
        'Brand ID': '',
      },
    ];

    // CSV headers matching the import route format exactly
    const headers = [
      'Name',
      'Slug',
      'SKU',
      'Description',
      'Price',
      'Original Price',
      'Main Image',
      'Additional Images',
      'Category',
      'Status',
      'In Stock',
      'Stock Quantity',
      'Meta Title',
      'Meta Description',
      'Meta Keywords',
      'OG Image',
      'Weight (grams)',
      'Dimensions',
      'Tax Class',
      'Supplier Name',
      'Supplier Location',
      'Supplier Certification',
      'Return Policy',
      'Return Days',
      'Brand ID',
    ];

    // Generate CSV content
    const csvRows = [
      headers.join(','), // Header row
      ...sampleData.map(row => {
        return headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          // Escape CSV field if needed
          if (value === null || value === undefined) {
            return '';
          }
          const stringValue = String(value);
          // If value contains comma, newline, or quote, wrap in quotes and escape quotes
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      }),
    ];

    const csvContent = csvRows.join('\n');

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="product-import-sample.csv"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.error('Error generating sample CSV', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to generate sample CSV file' },
      { status: 500 }
    );
  }
}

