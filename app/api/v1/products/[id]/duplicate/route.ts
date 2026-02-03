/**
 * POST /api/v1/products/[id]/duplicate - Duplicate product with variants (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/src/domains/products/services/product.service';
import { ProductVariantRepository } from '@/src/domains/products/repositories/variant.repository';
import { requireAdminRole } from '@/src/shared/middleware/auth.middleware';
import { handleApiError } from '@/src/shared/middleware/error.middleware';
import { logger } from '@/src/shared/utils/logger';
import { validateCsrf } from '@/lib/csrf';
import { slugify } from '@/src/shared/utils/formatters';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const { id } = await params;
    
    logger.request('POST', `/api/v1/products/${id}/duplicate`, ip);

    // Require admin authentication
    await requireAdminRole(request);

    // Validate CSRF token
    const csrfValid = await validateCsrf(request);
    if (!csrfValid) {
      logger.security('CSRF validation failed', { path: `/api/v1/products/${id}/duplicate`, method: 'POST', ip });
      return NextResponse.json(
        { success: false, error: 'CSRF token validation failed' },
        { status: 403 }
      );
    }

    const productService = new ProductService();
    const originalProduct = await productService.getProductById(id);

    // Create duplicate product data
    const duplicateData = {
      name: `${originalProduct.name} (Copy)`,
      slug: `${originalProduct.slug}-copy-${Date.now()}`,
      sku: originalProduct.sku ? `${originalProduct.sku}-COPY` : undefined,
      description: originalProduct.description || undefined,
      price: originalProduct.price,
      originalPrice: originalProduct.originalPrice || undefined,
      image: originalProduct.image,
      images: originalProduct.images || [],
      category: originalProduct.category, // Legacy
      categoryId: originalProduct.categoryId || undefined,
      status: 'DRAFT' as const, // Always duplicate as draft
      inStock: originalProduct.inStock,
      stockQuantity: originalProduct.stockQuantity,
      metaTitle: originalProduct.metaTitle || undefined,
      metaDescription: originalProduct.metaDescription || undefined,
      metaKeywords: originalProduct.metaKeywords || [],
      ogImage: originalProduct.ogImage || undefined,
      weight: originalProduct.weight || undefined,
      dimensions: originalProduct.dimensions || undefined,
      taxClass: originalProduct.taxClass || undefined,
      supplierName: originalProduct.supplierName || undefined,
      supplierLocation: originalProduct.supplierLocation || undefined,
      supplierCertification: originalProduct.supplierCertification || undefined,
      returnPolicy: originalProduct.returnPolicy || undefined,
      returnDays: originalProduct.returnDays || undefined,
      brandId: originalProduct.brandId || undefined,
      tagIds: originalProduct.tags?.map(tag => tag.id) || [],
      attributes: originalProduct.attributes?.map(attr => ({
        key: attr.key,
        value: attr.value,
      })) || [],
    };

    const duplicatedProduct = await productService.createProduct(duplicateData);

    // Duplicate variants if they exist
    if (originalProduct.variants && originalProduct.variants.length > 0) {
      const variantRepository = new ProductVariantRepository();
      for (const variant of originalProduct.variants) {
        await variantRepository.create({
          productId: duplicatedProduct.id,
          sku: `${variant.sku}-COPY`,
          name: variant.name,
          price: variant.price || undefined,
          stockQuantity: 0, // Reset stock for duplicate
          attributes: variant.attributes as any,
          image: variant.image || undefined,
        });
      }
    }

    // Fetch the complete duplicated product with relations
    const completeProduct = await productService.getProductById(duplicatedProduct.id);

    return NextResponse.json({
      success: true,
      message: 'Product duplicated successfully',
      data: completeProduct,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

