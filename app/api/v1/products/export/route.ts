/**
 * GET /api/v1/products/export - Export products to CSV (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/src/domains/products/services/product.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { generateCSV } from '@/src/shared/utils/csv';
import { Product } from '@/src/domains/products/types/product.types';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('GET', '/api/v1/products/export', ip);

    // Require admin authentication
    await requireAdminRole(request);

    const productService = new ProductService();
    const products = await productService.getAllProductsForExport();

    // Define CSV headers
    const headers = [
      { key: 'name' as keyof Product, label: 'Name' },
      { key: 'slug' as keyof Product, label: 'Slug' },
      { key: 'sku' as keyof Product, label: 'SKU' },
      { key: 'description' as keyof Product, label: 'Description' },
      { key: 'price' as keyof Product, label: 'Price' },
      { key: 'originalPrice' as keyof Product, label: 'Original Price' },
      { key: 'image' as keyof Product, label: 'Main Image' },
      { key: 'images' as keyof Product, label: 'Additional Images' },
      { key: 'category' as keyof Product, label: 'Category' },
      { key: 'status' as keyof Product, label: 'Status' },
      { key: 'inStock' as keyof Product, label: 'In Stock' },
      { key: 'stockQuantity' as keyof Product, label: 'Stock Quantity' },
      { key: 'metaTitle' as keyof Product, label: 'Meta Title' },
      { key: 'metaDescription' as keyof Product, label: 'Meta Description' },
      { key: 'metaKeywords' as keyof Product, label: 'Meta Keywords' },
      { key: 'ogImage' as keyof Product, label: 'OG Image' },
      { key: 'weight' as keyof Product, label: 'Weight (grams)' },
      { key: 'dimensions' as keyof Product, label: 'Dimensions' },
      { key: 'taxClass' as keyof Product, label: 'Tax Class' },
      { key: 'supplierName' as keyof Product, label: 'Supplier Name' },
      { key: 'supplierLocation' as keyof Product, label: 'Supplier Location' },
      { key: 'supplierCertification' as keyof Product, label: 'Supplier Certification' },
      { key: 'returnPolicy' as keyof Product, label: 'Return Policy' },
      { key: 'returnDays' as keyof Product, label: 'Return Days' },
      { key: 'brandId' as keyof Product, label: 'Brand ID' },
    ];

    // Generate CSV
    const csvContent = generateCSV(products, headers);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="products-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

