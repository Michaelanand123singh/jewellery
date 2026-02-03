/**
 * POST /api/v1/products/import - Import products from CSV (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/src/domains/products/services/product.service';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { parseCSV } from '@/src/shared/utils/csv';
import { CreateProductData } from '@/src/domains/products/types/product.types';
import { slugify } from '@/src/shared/utils/formatters';
import { sanitizeHtml } from '@/lib/sanitize';

interface CSVProductRow {
  Name: string;
  Slug?: string;
  SKU?: string;
  Description?: string;
  Price: string;
  'Original Price'?: string;
  'Main Image': string;
  'Additional Images'?: string;
  Category: string;
  Status?: string;
  'In Stock'?: string;
  'Stock Quantity'?: string;
  'Meta Title'?: string;
  'Meta Description'?: string;
  'Meta Keywords'?: string;
  'OG Image'?: string;
  'Weight (grams)'?: string;
  Dimensions?: string;
  'Tax Class'?: string;
  'Supplier Name'?: string;
  'Supplier Location'?: string;
  'Supplier Certification'?: string;
  'Return Policy'?: string;
  'Return Days'?: string;
  'Brand ID'?: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    logger.request('POST', '/api/v1/products/import', ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token (checks header, cookie, or form data)
    // For FormData, CSRF token should be in cookie (set by /api/csrf endpoint)
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: '/api/v1/products/import', method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    // Get CSV file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only CSV files are allowed.' },
        { status: 400 }
      );
    }

    // Read file content
    const csvContent = await file.text();

    // Parse CSV
    const headers = [
      { key: 'Name' as keyof CSVProductRow, label: 'Name' },
      { key: 'Slug' as keyof CSVProductRow, label: 'Slug' },
      { key: 'SKU' as keyof CSVProductRow, label: 'SKU' },
      { key: 'Description' as keyof CSVProductRow, label: 'Description' },
      { key: 'Price' as keyof CSVProductRow, label: 'Price' },
      { key: 'Original Price' as keyof CSVProductRow, label: 'Original Price' },
      { key: 'Main Image' as keyof CSVProductRow, label: 'Main Image' },
      { key: 'Additional Images' as keyof CSVProductRow, label: 'Additional Images' },
      { key: 'Category' as keyof CSVProductRow, label: 'Category' },
      { key: 'Status' as keyof CSVProductRow, label: 'Status' },
      { key: 'In Stock' as keyof CSVProductRow, label: 'In Stock' },
      { key: 'Stock Quantity' as keyof CSVProductRow, label: 'Stock Quantity' },
      { key: 'Meta Title' as keyof CSVProductRow, label: 'Meta Title' },
      { key: 'Meta Description' as keyof CSVProductRow, label: 'Meta Description' },
      { key: 'Meta Keywords' as keyof CSVProductRow, label: 'Meta Keywords' },
      { key: 'OG Image' as keyof CSVProductRow, label: 'OG Image' },
      { key: 'Weight (grams)' as keyof CSVProductRow, label: 'Weight (grams)' },
      { key: 'Dimensions' as keyof CSVProductRow, label: 'Dimensions' },
      { key: 'Tax Class' as keyof CSVProductRow, label: 'Tax Class' },
      { key: 'Supplier Name' as keyof CSVProductRow, label: 'Supplier Name' },
      { key: 'Supplier Location' as keyof CSVProductRow, label: 'Supplier Location' },
      { key: 'Supplier Certification' as keyof CSVProductRow, label: 'Supplier Certification' },
      { key: 'Return Policy' as keyof CSVProductRow, label: 'Return Policy' },
      { key: 'Return Days' as keyof CSVProductRow, label: 'Return Days' },
      { key: 'Brand ID' as keyof CSVProductRow, label: 'Brand ID' },
    ];

    const csvRows = parseCSV<CSVProductRow>(csvContent, headers);

    if (csvRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    // Convert CSV rows to CreateProductData
    const productsToCreate: CreateProductData[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed

      try {
        // Validate required fields
        if (!row.Name || !row.Price || !row['Main Image'] || !row.Category) {
          errors.push({
            row: rowNumber,
            error: 'Missing required fields: Name, Price, Main Image, or Category',
          });
          continue;
        }

        // Parse price
        const price = parseFloat(row.Price);
        if (isNaN(price) || price <= 0) {
          errors.push({
            row: rowNumber,
            error: 'Invalid price value',
          });
          continue;
        }

        // Parse original price
        let originalPrice: number | undefined;
        if (row['Original Price']) {
          originalPrice = parseFloat(row['Original Price']);
          if (isNaN(originalPrice) || originalPrice <= 0) {
            originalPrice = undefined;
          }
        }

        // Parse images
        const images: string[] = [];
        if (row['Additional Images']) {
          if (Array.isArray(row['Additional Images'])) {
            images.push(...row['Additional Images']);
          } else if (typeof row['Additional Images'] === 'string') {
            images.push(...row['Additional Images'].split(';').map(img => img.trim()).filter(img => img));
          }
        }

        // Parse meta keywords
        let metaKeywords: string[] | undefined;
        if (row['Meta Keywords']) {
          if (Array.isArray(row['Meta Keywords'])) {
            metaKeywords = row['Meta Keywords'];
          } else if (typeof row['Meta Keywords'] === 'string') {
            metaKeywords = row['Meta Keywords'].split(',').map(k => k.trim()).filter(k => k);
          }
        }

        // Parse dimensions
        let dimensions: { length?: number; width?: number; height?: number; unit?: string } | undefined;
        if (row.Dimensions) {
          try {
            if (typeof row.Dimensions === 'string' && row.Dimensions.startsWith('{')) {
              dimensions = JSON.parse(row.Dimensions);
            } else if (typeof row.Dimensions === 'object') {
              dimensions = row.Dimensions;
            }
          } catch {
            // Invalid JSON, skip dimensions
          }
        }

        // Parse status
        const status = (row.Status?.toUpperCase() === 'PUBLISHED' ? 'PUBLISHED' :
          row.Status?.toUpperCase() === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

        // Parse inStock
        const inStock = row['In Stock'] === undefined || row['In Stock'] === '' ?
          true : row['In Stock'] === 'true' || row['In Stock'] === '1';

        // Parse stock quantity
        const stockQuantity = row['Stock Quantity'] ?
          parseInt(row['Stock Quantity']) : 0;

        // Parse weight
        let weight: number | undefined;
        if (row['Weight (grams)']) {
          weight = parseFloat(row['Weight (grams)']);
          if (isNaN(weight)) {
            weight = undefined;
          }
        }

        // Parse return days
        let returnDays: number | undefined;
        if (row['Return Days']) {
          returnDays = parseInt(row['Return Days']);
          if (isNaN(returnDays)) {
            returnDays = undefined;
          }
        }

        // Generate slug if not provided
        const slug = row.Slug || slugify(row.Name);

        // Sanitize description
        let description = row.Description;
        if (description) {
          description = sanitizeHtml(description);
        }

        const productData: CreateProductData = {
          name: row.Name.trim(),
          slug,
          sku: row.SKU?.trim() || undefined,
          description: description || undefined,
          price,
          originalPrice,
          image: row['Main Image'].trim(),
          images: images.length > 0 ? images : undefined,
          category: row.Category.trim(),
          status,
          inStock,
          stockQuantity,
          metaTitle: row['Meta Title']?.trim() || undefined,
          metaDescription: row['Meta Description']?.trim() || undefined,
          metaKeywords: metaKeywords && metaKeywords.length > 0 ? metaKeywords : undefined,
          ogImage: row['OG Image']?.trim() || undefined,
          weight,
          dimensions,
          taxClass: row['Tax Class']?.trim() || undefined,
          supplierName: row['Supplier Name']?.trim() || undefined,
          supplierLocation: row['Supplier Location']?.trim() || undefined,
          supplierCertification: row['Supplier Certification']?.trim() || undefined,
          returnPolicy: row['Return Policy']?.trim() || undefined,
          returnDays,
          brandId: row['Brand ID']?.trim() || undefined,
        };

        productsToCreate.push(productData);
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (productsToCreate.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid products to import',
        errors,
      }, { status: 400 });
    }

    // Bulk create products
    const productService = new ProductService();
    const result = await productService.bulkCreateProducts(productsToCreate);

    return NextResponse.json({
      success: true,
      message: `Imported ${result.success.length} product(s) successfully`,
      data: {
        imported: result.success.length,
        failed: result.failed.length,
        total: productsToCreate.length,
        errors: [...errors, ...result.failed.map(f => ({ row: 'N/A', error: f.error }))],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

