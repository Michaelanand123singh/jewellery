"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Package, Upload, X, Image as ImageIcon, Copy, Download, FileUp, FileText } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface Product {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    category: string;
    categoryId?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    inStock: boolean;
    stockQuantity: number;
    rating?: number;
    reviewCount: number;
    // SEO fields
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string[];
    ogImage?: string;
    // Physical attributes
    weight?: number;
    dimensions?: { length?: number; width?: number; height?: number; unit?: string };
    taxClass?: string;
    // Supplier information
    supplierName?: string;
    supplierLocation?: string;
    supplierCertification?: string;
    // Return policy
    returnPolicy?: string;
    returnDays?: number;
    // Relations
    brandId?: string;
    brand?: { id: string; name: string; slug: string };
    tags?: Array<{ id: string; name: string; slug: string }>;
    variants?: Array<{
        id: string;
        sku: string;
        name: string;
        price?: number;
        stockQuantity: number;
        attributes: Record<string, string>;
        image?: string;
    }>;
    attributes?: Array<{ id: string; key: string; value: string }>;
}

interface ProductFormData {
    name: string;
    slug: string;
    sku: string;
    description: string;
    price: string;
    originalPrice: string;
    image: string;
    images: string;
    category: string;
    subcategory: string;
    categoryId: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    inStock: boolean;
    stockQuantity: string;
    // SEO fields
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    ogImage: string;
    // Physical attributes
    weight: string;
    dimensionsLength: string;
    dimensionsWidth: string;
    dimensionsHeight: string;
    dimensionsUnit: string;
    taxClass: string;
    // Supplier information
    supplierName: string;
    supplierLocation: string;
    supplierCertification: string;
    // Return policy
    returnPolicy: string;
    returnDays: string;
    // Relations
    brandId: string;
    tagIds: string[];
    // Specifications (key-value pairs)
    specifications: Array<{ key: string; value: string }>;
}

// Category type as returned from /api/v1/categories?tree=true
interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

const initialFormData: ProductFormData = {
    name: "",
    slug: "",
    sku: "",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    images: "",
    category: "",
    subcategory: "",
    categoryId: "",
    status: "DRAFT",
    inStock: true,
    stockQuantity: "0",
    // SEO fields
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    ogImage: "",
    // Physical attributes
    weight: "",
    dimensionsLength: "",
    dimensionsWidth: "",
    dimensionsHeight: "",
    dimensionsUnit: "cm",
    taxClass: "standard",
    // Supplier information
    supplierName: "",
    supplierLocation: "",
    supplierCertification: "",
    // Return policy
    returnPolicy: "",
    returnDays: "7",
    // Relations
    brandId: "",
    tagIds: [],
    // Specifications
    specifications: [],
};

interface Brand {
    id: string;
    name: string;
    slug: string;
}

interface ProductTag {
    id: string;
    name: string;
    slug: string;
}

export default function ProductManagement() {
    // const router = useRouter(); // Handled by layout/middleware
    const { user } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<CategoryNode[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [tags, setTags] = useState<ProductTag[]>([]);
    const [variants, setVariants] = useState<Product['variants']>([]);
    const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(20); // Fixed limit per page
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    // Image upload states
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingAdditional, setUploadingAdditional] = useState(false);
    const [uploadingOG, setUploadingOG] = useState(false);
    const [mainImagePreview, setMainImagePreview] = useState("");
    const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
    const [ogImagePreview, setOgImagePreview] = useState("");
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const mainFileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);
    const ogFileInputRef = useRef<HTMLInputElement>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchCategories();
            fetchBrands();
            fetchTags();
        }
    }, [user]);

    // Refetch products when page, search, or filters change, or when user becomes admin
    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchProducts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, page, searchQuery, statusFilter, categoryFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            
            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            // Add search query if provided
            if (searchQuery.trim()) {
                params.append("search", searchQuery.trim());
            }

            // Add status filter if not "all"
            if (statusFilter !== "all") {
                params.append("status", statusFilter);
            }

            // Add category filter if not "all"
            if (categoryFilter !== "all") {
                params.append("category", categoryFilter);
            }

            const response = await fetch(`/api/v1/products?${params.toString()}`);
            if (!response.ok) {
                console.error("Failed to fetch products:", response.statusText);
                toast.error("Failed to load products");
                return;
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Products endpoint returned non-JSON response");
                toast.error("Failed to load products");
                return;
            }
            const data = await response.json();
            if (data.success) {
                setProducts(data.data || []);
                
                // Update pagination metadata from API response
                if (data.meta) {
                    setTotal(data.meta.total || 0);
                    setTotalPages(data.meta.totalPages || 0);
                } else {
                    // Fallback: calculate from results
                    const productCount = data.data?.length || 0;
                    setTotal(productCount);
                    setTotalPages(Math.ceil(productCount / limit));
                }
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);
            // Use v1 categories API with tree=true so we get parent/child structure
            const response = await apiClient.get<CategoryNode[]>("/categories", { tree: "true" });
            if (response.success && response.data) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setCategoriesLoading(false);
        }
    };

    const fetchBrands = async () => {
        try {
            const response = await apiClient.get<Brand[]>("/brands");
            if (response.success && response.data) {
                setBrands(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch brands:", error);
        }
    };

    const fetchTags = async () => {
        try {
            const response = await apiClient.get<ProductTag[]>("/tags");
            if (response.success && response.data) {
                setTags(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch tags:", error);
        }
    };

    const fetchVariants = async (productId: string) => {
        try {
            const response = await apiClient.get<Product['variants']>(`/products/${productId}/variants`);
            if (response.success && response.data) {
                setVariants(response.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch variants:", error);
        }
    };

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);

            // Map saved category slug back to category + optional subcategory
            const findBySlug = (nodes: CategoryNode[], slug: string): { node: CategoryNode | null; parent?: CategoryNode | null } => {
              for (const node of nodes) {
                if (node.slug === slug) {
                  return { node, parent: undefined };
                }
                if (node.children && node.children.length > 0) {
                  const match = findBySlug(node.children, slug);
                  if (match.node) {
                    return { node: match.node, parent: match.parent ?? node };
                  }
                }
              }
              return { node: null, parent: undefined };
            };

            const { node, parent } = findBySlug(categories, product.category || "");

            let mainCategorySlug = "";
            let subcategorySlug = "";

            if (node) {
              if (parent && parent.slug !== node.slug) {
                // Child category selected
                mainCategorySlug = parent.slug;
                subcategorySlug = node.slug;
              } else {
                // Root category
                mainCategorySlug = node.slug;
              }
            }

            // Find categoryId from category slug
            const findCategoryId = (slug: string): string => {
                const findInNodes = (nodes: CategoryNode[]): string | undefined => {
                    for (const node of nodes) {
                        if (node.slug === slug) return node.id;
                        if (node.children) {
                            const found = findInNodes(node.children);
                            if (found) return found;
                        }
                    }
                };
                return findInNodes(categories) || "";
            };

            const categoryId = product.categoryId || findCategoryId(product.category || "");
            
            setFormData({
                name: product.name || "",
                slug: product.slug || "",
                sku: product.sku || "",
                description: product.description || "",
                price: product.price != null ? product.price.toString() : "",
                originalPrice: product.originalPrice != null ? product.originalPrice.toString() : "",
                image: product.image || "",
                images: product.images?.join(", ") || "",
                category: mainCategorySlug,
                subcategory: subcategorySlug,
                categoryId: categoryId,
                status: product.status || "DRAFT",
                inStock: product.inStock ?? true,
                stockQuantity: product.stockQuantity != null ? product.stockQuantity.toString() : "0",
                // SEO fields
                metaTitle: product.metaTitle || "",
                metaDescription: product.metaDescription || "",
                metaKeywords: product.metaKeywords?.join(", ") || "",
                ogImage: product.ogImage || "",
                // Physical attributes
                weight: product.weight != null ? product.weight.toString() : "",
                dimensionsLength: product.dimensions?.length?.toString() || "",
                dimensionsWidth: product.dimensions?.width?.toString() || "",
                dimensionsHeight: product.dimensions?.height?.toString() || "",
                dimensionsUnit: product.dimensions?.unit || "cm",
                taxClass: product.taxClass || "standard",
                // Supplier information
                supplierName: product.supplierName || "",
                supplierLocation: product.supplierLocation || "",
                supplierCertification: product.supplierCertification || "",
                // Return policy
                returnPolicy: product.returnPolicy || "",
                returnDays: product.returnDays != null ? product.returnDays.toString() : "7",
                // Relations
                brandId: product.brandId || "",
                tagIds: product.tags?.map(tag => tag.id) || [],
                // Specifications
                specifications: product.attributes?.map(attr => ({ key: attr.key, value: attr.value })) || [],
            });
            setMainImagePreview(product.image || "");
            setAdditionalImagePreviews(product.images || []);
            setOgImagePreview(product.ogImage || "");
            
            // Fetch variants if editing
            if (product.id) {
                fetchVariants(product.id);
            }
        } else {
            setEditingProduct(null);
            setFormData(initialFormData);
            setMainImagePreview("");
            setAdditionalImagePreviews([]);
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingProduct(null);
        setFormData(initialFormData);
        setMainImagePreview("");
        setAdditionalImagePreviews([]);
        setOgImagePreview("");
        setVariants([]);
        setActiveTab("basic");
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        setFormData((prev) => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const handleCategoryChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            category: value,
            subcategory: "", // Reset subcategory when category changes
        }));
    };

    const handleSubcategoryChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            subcategory: value,
        }));
    };

    // Get available subcategories for selected category
    const getAvailableSubcategories = (parentSlug?: string) => {
        const slug = parentSlug || formData.category;
        const parent = categories.find((cat) => cat.slug === slug);
        return parent?.children || [];
    };

    // Helper to format category display in table
    const formatCategoryDisplay = (categorySlug: string) => {
        if (!categorySlug) return <span>-</span>;

        // Find matching category node by slug
        const findBySlug = (nodes: CategoryNode[], slug: string): { node: CategoryNode | null; parent?: CategoryNode | null } => {
          for (const node of nodes) {
            if (node.slug === slug) {
              return { node, parent: undefined };
            }
            if (node.children && node.children.length > 0) {
              const match = findBySlug(node.children, slug);
              if (match.node) {
                return { node: match.node, parent: match.parent ?? node };
              }
            }
          }
          return { node: null, parent: undefined };
        };

        const { node, parent } = findBySlug(categories, categorySlug);

        if (!node) {
          // Fallback: just show the raw slug nicely formatted
          return <span>{categorySlug.replace(/-/g, " ")}</span>;
        }

        if (parent && parent.slug !== node.slug) {
        return (
            <span>
              {parent.name} - {node.name}
            </span>
        );
        }

        return <span>{node.name}</span>;
    };

    const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploadingMain(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'products/main');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (data.success) {
                    setFormData(prev => ({ ...prev, image: data.data.url }));
                    setMainImagePreview(data.data.url);
                    toast.success('Image uploaded successfully');
                } else {
                    toast.error(data.error || 'Failed to upload image');
                }
            } else {
                console.error("Upload failed with status:", response.status);
                const text = await response.text();
                toast.error(`Upload failed: Server error ${response.status}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploadingMain(false);
        }
    };

    const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Validate total images (max 5)
        if (additionalImagePreviews.length + files.length > 5) {
            toast.error('Maximum 5 additional images allowed');
            return;
        }

        setUploadingAdditional(true);
        const uploadedUrls: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    toast.error(`${file.name} is not an image file`);
                    continue;
                }

                // Validate file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    toast.error(`${file.name} exceeds 5MB limit`);
                    continue;
                }

                const formData = new FormData();
                formData.append('file', file);
                formData.append('folder', 'products/additional');

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    if (data.success) {
                        uploadedUrls.push(data.data.url);
                    } else {
                        toast.error(data.error || `Failed to upload ${file.name}`);
                    }
                } else {
                    console.error(`Upload failed for ${file.name} with status:`, response.status);
                    toast.error(`Failed to upload ${file.name}: Server error ${response.status}`);
                }
            }

            if (uploadedUrls.length > 0) {
                const newPreviews = [...additionalImagePreviews, ...uploadedUrls];
                setAdditionalImagePreviews(newPreviews);
                setFormData(prev => ({
                    ...prev,
                    images: newPreviews.join(', ')
                }));
                toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploadingAdditional(false);
        }
    };

    const removeAdditionalImage = (index: number) => {
        const newPreviews = additionalImagePreviews.filter((_, i) => i !== index);
        setAdditionalImagePreviews(newPreviews);
        setFormData(prev => ({
            ...prev,
            images: newPreviews.join(', ')
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate required fields
            if (!formData.name.trim()) {
                toast.error("Product name is required");
                setSubmitting(false);
                return;
            }

            if (!formData.slug.trim()) {
                toast.error("Product slug is required");
                setSubmitting(false);
                return;
            }

            if (!formData.price || parseFloat(formData.price) <= 0) {
                toast.error("Valid price is required");
                setSubmitting(false);
                return;
            }

            if (!formData.image.trim()) {
                toast.error("Product image is required");
                setSubmitting(false);
                return;
            }

            // Validate image URL format
            try {
                new URL(formData.image);
            } catch {
                toast.error("Image must be a valid URL");
                setSubmitting(false);
                return;
            }

            if (!formData.category) {
                toast.error("Category is required");
                setSubmitting(false);
                return;
            }

            const imagesArray = formData.images
                .split(",")
                .map((img) => img.trim())
                .filter((img) => img && img.length > 0);

            // Use category slug from selection; if a subcategory is selected,
            // store the subcategory slug, otherwise store the root category slug.
            const finalCategory = formData.subcategory || formData.category;

            // Find categoryId from category slug
            const findCategoryId = (slug: string): string | undefined => {
                const findInNodes = (nodes: CategoryNode[]): string | undefined => {
                    for (const node of nodes) {
                        if (node.slug === slug) return node.id;
                        if (node.children) {
                            const found = findInNodes(node.children);
                            if (found) return found;
                        }
                    }
                };
                return findInNodes(categories);
            };

            const finalCategoryId = formData.categoryId || findCategoryId(finalCategory);

            // Parse dimensions - only include if at least one dimension is provided
            const dimensions = (formData.dimensionsLength || formData.dimensionsWidth || formData.dimensionsHeight)
                ? {
                    length: formData.dimensionsLength ? parseFloat(formData.dimensionsLength) : undefined,
                    width: formData.dimensionsWidth ? parseFloat(formData.dimensionsWidth) : undefined,
                    height: formData.dimensionsHeight ? parseFloat(formData.dimensionsHeight) : undefined,
                    unit: formData.dimensionsUnit || "cm",
                }
                : undefined;

            // Parse meta keywords
            const metaKeywords = formData.metaKeywords
                ? formData.metaKeywords.split(",").map(k => k.trim()).filter(k => k)
                : [];

            // Helper to convert empty strings to undefined
            const cleanString = (value: string | undefined): string | undefined => {
                return value && value.trim() ? value.trim() : undefined;
            };

            // Helper to parse number or return undefined
            const parseNumber = (value: string | undefined): number | undefined => {
                if (!value || !value.trim()) return undefined;
                const parsed = parseFloat(value);
                return isNaN(parsed) ? undefined : parsed;
            };

            const productData = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                sku: cleanString(formData.sku),
                description: cleanString(formData.description),
                price: parseFloat(formData.price),
                originalPrice: parseNumber(formData.originalPrice),
                image: formData.image.trim(),
                images: imagesArray.length > 0 ? imagesArray : undefined,
                category: finalCategory, // Legacy: kept for backward compatibility
                categoryId: finalCategoryId || undefined, // New: FK
                status: formData.status,
                inStock: formData.inStock,
                stockQuantity: parseInt(formData.stockQuantity) || 0,
                // SEO fields
                metaTitle: cleanString(formData.metaTitle),
                metaDescription: cleanString(formData.metaDescription),
                metaKeywords: metaKeywords.length > 0 ? metaKeywords : undefined,
                ogImage: cleanString(formData.ogImage),
                // Physical attributes
                weight: parseNumber(formData.weight),
                dimensions: dimensions,
                taxClass: cleanString(formData.taxClass) || undefined,
                // Supplier information
                supplierName: cleanString(formData.supplierName),
                supplierLocation: cleanString(formData.supplierLocation),
                supplierCertification: cleanString(formData.supplierCertification),
                // Return policy
                returnPolicy: cleanString(formData.returnPolicy),
                returnDays: formData.returnDays ? parseInt(formData.returnDays) : undefined,
                // Relations
                brandId: cleanString(formData.brandId),
                tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
                attributes: formData.specifications.length > 0 
                    ? formData.specifications.filter(spec => spec.key.trim() && spec.value.trim())
                    : undefined,
            };

            let response;
            if (editingProduct) {
                response = await apiClient.put(`/products/${editingProduct.id}`, productData);
            } else {
                response = await apiClient.post("/products", productData);
            }

            if (response.success) {
                toast.success(
                    editingProduct
                        ? "Product updated successfully"
                        : "Product created successfully"
                );
                handleCloseDialog();
                fetchProducts();
            } else {
                toast.error(response.error || "Failed to save product");
            }
        } catch (error: any) {
            console.error("Error saving product:", error);
            
            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('CSRF')) {
                    toast.error("Security validation failed. Please refresh the page and try again.");
                } else if (error.message.includes('slug')) {
                    toast.error("A product with this slug already exists. Please change the product name.");
                } else if (error.message.includes('SKU')) {
                    toast.error("A product with this SKU already exists. Please use a different SKU.");
                } else if (error.message.includes('validation')) {
                    toast.error(`Validation error: ${error.message}`);
                } else {
                    toast.error(error.message || "An error occurred while saving the product");
                }
            } else {
                toast.error("An error occurred while saving the product");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            const response = await apiClient.delete(`/products/${productId}`);

            if (response.success) {
                toast.success("Product deleted successfully");
                fetchProducts();
            } else {
                toast.error(response.error || "Failed to delete product");
            }
        } catch (error: any) {
            // Extract error message from API response
            const errorMessage = error?.message || error?.error || "An error occurred while deleting the product";
            toast.error(errorMessage);
            
            // Only log unexpected errors (not user-facing validation errors)
            if (error?.status !== 409 && error?.status !== 404) {
                console.error("Error deleting product:", error);
            }
        }
    };

    const handleDuplicate = async (productId: string) => {
        try {
            const response = await apiClient.post(`/products/${productId}/duplicate`, {});
            if (response.success) {
                toast.success("Product duplicated successfully");
                fetchProducts();
            } else {
                toast.error(response.error || "Failed to duplicate product");
            }
        } catch (error) {
            console.error("Error duplicating product:", error);
            toast.error("An error occurred while duplicating the product");
        }
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const response = await fetch("/api/v1/products/export", {
                method: "GET",
                headers: {
                    // CSRF token will be handled by apiClient if needed
                },
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.error || "Failed to export products");
                return;
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get("Content-Disposition");
            const filename = contentDisposition
                ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") || "products-export.csv"
                : "products-export.csv";

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Products exported successfully");
        } catch (error) {
            console.error("Error exporting products:", error);
            toast.error("An error occurred while exporting products");
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadSample = async () => {
        try {
            const response = await fetch("/api/v1/products/import/sample", {
                method: "GET",
            });

            if (!response.ok) {
                const error = await response.json();
                toast.error(error.error || "Failed to download sample file");
                return;
            }

            // Get filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get("Content-Disposition");
            const filename = contentDisposition
                ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") || "product-import-sample.csv"
                : "product-import-sample.csv";

            // Download file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Sample CSV file downloaded successfully");
        } catch (error) {
            console.error("Error downloading sample file:", error);
            toast.error("An error occurred while downloading sample file");
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            toast.error('Please select a CSV file');
            return;
        }

        try {
            setImporting(true);
            
            // Get CSRF token
            let csrfToken = '';
            try {
                const csrfResponse = await fetch('/api/csrf');
                const csrfData = await csrfResponse.json();
                if (csrfData.success && csrfData.token) {
                    csrfToken = csrfData.token;
                }
            } catch (error) {
                console.warn('Failed to fetch CSRF token:', error);
            }

            const formData = new FormData();
            formData.append('file', file);
            if (csrfToken) {
                formData.append('csrfToken', csrfToken);
            }

            const response = await fetch("/api/v1/products/import", {
                method: "POST",
                headers: csrfToken ? {
                    'X-CSRF-Token': csrfToken,
                } : {},
                body: formData,
            });

            const data = await response.json();

            // Log full response for debugging
            console.log("Import response:", {
                status: response.status,
                success: data.success,
                imported: data.data?.imported || data.imported || 0,
                failed: data.data?.failed || data.failed || 0,
                totalErrors: (data.data?.errors || data.errors || []).length,
            });

            if (response.ok && data.success) {
                toast.success(
                    `Imported ${data.data.imported} product(s) successfully${data.data.failed > 0 ? ` (${data.data.failed} failed)` : ''}`
                );
                if (data.data.errors && data.data.errors.length > 0) {
                    console.warn("Import errors:", data.data.errors);
                    // Show detailed error message if there are errors
                    const errorSummary = data.data.errors.slice(0, 5).map((err: any) => 
                        `Row ${err.row}${err.productName ? ` (${err.productName})` : ''}: ${err.error}`
                    ).join('\n');
                    if (data.data.errors.length > 5) {
                        toast.warning(`${data.data.errors.length} errors occurred. First 5:\n${errorSummary}`, {
                            duration: 10000,
                        });
                    } else {
                        toast.warning(`Some errors occurred:\n${errorSummary}`, {
                            duration: 10000,
                        });
                    }
                }
                fetchProducts();
            } else {
                // Handle both 400 errors and other errors
                const errorMessage = data.error || data.message || "Failed to import products";
                const errors = data.errors || data.data?.errors || [];
                
                console.error("Import failed:", {
                    error: errorMessage,
                    totalErrors: errors.length,
                    sampleErrors: errors.slice(0, 3),
                });

                // Show main error
                toast.error(errorMessage, {
                    duration: 8000,
                });

                // Show detailed errors if available
                if (errors.length > 0) {
                    console.error("All import errors:", errors);
                    
                    // Group errors by type for better understanding
                    const errorGroups = errors.reduce((acc: any, err: any) => {
                        const errorType = err.error?.split(':')[0] || 'Unknown';
                        if (!acc[errorType]) {
                            acc[errorType] = [];
                        }
                        acc[errorType].push(err);
                        return acc;
                    }, {});

                    // Show error summary
                    const errorSummary = errors.slice(0, 10).map((err: any) => 
                        `Row ${err.row}${err.productName ? ` (${err.productName})` : ''}: ${err.error}`
                    ).join('\n');
                    
                    if (errors.length > 10) {
                        toast.error(`\n${errors.length} total errors. First 10:\n${errorSummary}`, {
                            duration: 20000,
                        });
                    } else {
                        toast.error(`\nErrors:\n${errorSummary}`, {
                            duration: 20000,
                        });
                    }

                    // Log error groups for debugging
                    console.group("Error Analysis");
                    Object.entries(errorGroups).forEach(([type, errs]: [string, any]) => {
                        console.log(`${type}: ${errs.length} occurrences`);
                        if (errs.length <= 5) {
                            console.log(errs);
                        }
                    });
                    console.groupEnd();
                }
            }
        } catch (error) {
            console.error("Error importing products:", error);
            toast.error("An error occurred while importing products");
        } finally {
            setImporting(false);
            // Reset file input
            if (importFileInputRef.current) {
                importFileInputRef.current.value = '';
            }
        }
    };

    const addSpecification = () => {
        setFormData(prev => ({
            ...prev,
            specifications: [...prev.specifications, { key: "", value: "" }]
        }));
    };

    const removeSpecification = (index: number) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index)
        }));
    };

    const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.map((spec, i) =>
                i === index ? { ...spec, [field]: value } : spec
            )
        }));
    };

    const handleOGImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        setUploadingOG(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'products/og');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (data.success) {
                    setFormData(prev => ({ ...prev, ogImage: data.data.url }));
                    setOgImagePreview(data.data.url);
                    toast.success('OG Image uploaded successfully');
                } else {
                    toast.error(data.error || 'Failed to upload image');
                }
            } else {
                toast.error(`Upload failed: Server error ${response.status}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploadingOG(false);
        }
    };

    return (
        <div className="w-full overflow-x-auto sm:overflow-visible">
            <div className="min-w-[360px] sm:min-w-0">
            <Card className="shrink-0">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl sm:text-2xl">Product Management</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Add, edit, or remove products from your store
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                onClick={handleDownloadSample}
                                size="sm"
                                className="flex-1 sm:flex-initial"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Download Sample CSV</span>
                                <span className="sm:hidden">Sample</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExport}
                                disabled={exporting || products.length === 0}
                                size="sm"
                                className="flex-1 sm:flex-initial"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">{exporting ? "Exporting..." : "Export CSV"}</span>
                                <span className="sm:hidden">{exporting ? "..." : "Export"}</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => importFileInputRef.current?.click()}
                                disabled={importing}
                                size="sm"
                                className="flex-1 sm:flex-initial"
                            >
                                <FileUp className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">{importing ? "Importing..." : "Import CSV"}</span>
                                <span className="sm:hidden">{importing ? "..." : "Import"}</span>
                            </Button>
                            <Input
                                type="file"
                                ref={importFileInputRef}
                                onChange={handleImport}
                                accept=".csv"
                                className="hidden"
                            />
                            <Button onClick={() => handleOpenDialog()} size="sm" className="flex-1 sm:flex-initial">
                                <Plus className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Add Product</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <Input
                                    placeholder="Search products by name or description..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1); // Reset to first page on search
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={(value) => {
                                setStatusFilter(value);
                                setPage(1); // Reset to first page on filter change
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="PUBLISHED">Published</SelectItem>
                                    <SelectItem value="DRAFT">Draft</SelectItem>
                                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={categoryFilter} onValueChange={(value) => {
                                setCategoryFilter(value);
                                setPage(1); // Reset to first page on filter change
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.slug}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading products...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-semibold mb-2">No products found</p>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "Get started by adding your first product"}
                            </p>
                            {!searchQuery && statusFilter === "all" && categoryFilter === "all" && (
                                <Button onClick={() => handleOpenDialog()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Product
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[80px]">Image</TableHead>
                                        <TableHead className="min-w-[200px]">Name</TableHead>
                                        <TableHead className="min-w-[100px]">Category</TableHead>
                                        <TableHead className="min-w-[120px]">Price</TableHead>
                                        <TableHead className="min-w-[80px]">Stock</TableHead>
                                        <TableHead className="min-w-[100px]">Status</TableHead>
                                        <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-12 w-12 object-cover rounded"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell>
                                                {formatCategoryDisplay(product.category)}
                                            </TableCell>
                                            <TableCell>
                                                ₹{product.price.toLocaleString()}
                                                {product.originalPrice && (
                                                    <span className="ml-2 text-sm text-muted-foreground line-through">
                                                        ₹{product.originalPrice.toLocaleString()}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>{product.stockQuantity}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${product.inStock
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {product.inStock ? "In Stock" : "Out of Stock"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(product)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDuplicate(product.id)}
                                                        title="Duplicate product"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(product.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} products
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1 || loading}
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center gap-2 px-4">
                                        <span className="text-sm text-muted-foreground">
                                            Page {page} of {totalPages}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || loading}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">
                            {editingProduct ? "Edit Product" : "Add New Product"}
                        </DialogTitle>
                        <DialogDescription className="text-xs sm:text-sm">
                            {editingProduct
                                ? "Update the product details below"
                                : "Fill in the details to create a new product"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 h-auto">
                                <TabsTrigger value="basic" className="text-xs sm:text-sm">Basic</TabsTrigger>
                                <TabsTrigger value="pricing" className="text-xs sm:text-sm">Pricing</TabsTrigger>
                                <TabsTrigger value="seo" className="text-xs sm:text-sm">SEO</TabsTrigger>
                                <TabsTrigger value="variants" className="text-xs sm:text-sm">Variants</TabsTrigger>
                                <TabsTrigger value="specs" className="text-xs sm:text-sm">Specs</TabsTrigger>
                                <TabsTrigger value="supplier" className="text-xs sm:text-sm">Supplier</TabsTrigger>
                                <TabsTrigger value="images" className="text-xs sm:text-sm">Images</TabsTrigger>
                            </TabsList>

                            {/* Basic Info Tab */}
                            <TabsContent value="basic" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    required
                                    placeholder="e.g., Gold Diamond Ring"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="slug">Slug *</Label>
                                <Input
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., gold-diamond-ring"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Auto-generated from product name
                                </p>
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Product description..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                    placeholder="e.g., PROD-001"
                                />
                            </div>

                            <div>
                                <Label htmlFor="brandId">Brand</Label>
                                <Select
                                    value={formData.brandId || "none"}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, brandId: value === "none" ? "" : value }))}
                                >
                                    <SelectTrigger id="brandId">
                                        <SelectValue placeholder="Select a brand (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {brands.map((brand) => (
                                            <SelectItem key={brand.id} value={brand.id}>
                                                {brand.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="col-span-2">
                                <Label>Tags</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <div key={tag.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`tag-${tag.id}`}
                                                checked={formData.tagIds.includes(tag.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            tagIds: [...prev.tagIds, tag.id]
                                                        }));
                                                    } else {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            tagIds: prev.tagIds.filter(id => id !== tag.id)
                                                        }));
                                                    }
                                                }}
                                            />
                                            <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer">
                                                {tag.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={handleCategoryChange}
                                    required
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.slug}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.category && getAvailableSubcategories().length > 0 && (
                                <div className="col-span-2">
                                    <Label htmlFor="subcategory">Subcategory</Label>
                                    <Select
                                        value={formData.subcategory || "none"}
                                        onValueChange={(value) => handleSubcategoryChange(value === "none" ? "" : value)}
                                    >
                                        <SelectTrigger id="subcategory">
                                            <SelectValue placeholder="Select a subcategory (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {getAvailableSubcategories().map((subcategory) => (
                                                <SelectItem key={subcategory.id} value={subcategory.slug}>
                                                    {subcategory.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                                </div>
                            </TabsContent>

                            {/* Pricing & Status Tab */}
                            <TabsContent value="pricing" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="price">Price (₹) *</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="originalPrice">Original Price (₹)</Label>
                                <Input
                                    id="originalPrice"
                                    name="originalPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.originalPrice}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <Label htmlFor="status">Product Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Draft</SelectItem>
                                        <SelectItem value="PUBLISHED">Published</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                                <Input
                                    id="stockQuantity"
                                    name="stockQuantity"
                                    type="number"
                                    value={formData.stockQuantity}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-8">
                                <input
                                    type="checkbox"
                                    id="inStock"
                                    name="inStock"
                                    checked={formData.inStock}
                                    onChange={handleInputChange}
                                    className="rounded"
                                />
                                <Label htmlFor="inStock" className="cursor-pointer">
                                    In Stock
                                </Label>
                            </div>
                                </div>
                            </TabsContent>

                            {/* SEO Tab */}
                            <TabsContent value="seo" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label htmlFor="metaTitle">Meta Title</Label>
                                        <Input
                                            id="metaTitle"
                                            name="metaTitle"
                                            value={formData.metaTitle}
                                            onChange={handleInputChange}
                                            placeholder="SEO title for search engines"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="metaDescription">Meta Description</Label>
                                        <Textarea
                                            id="metaDescription"
                                            name="metaDescription"
                                            value={formData.metaDescription}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="SEO description for search engines"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="metaKeywords">Meta Keywords</Label>
                                        <Input
                                            id="metaKeywords"
                                            name="metaKeywords"
                                            value={formData.metaKeywords}
                                            onChange={handleInputChange}
                                            placeholder="keyword1, keyword2, keyword3"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Comma-separated keywords
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <Label>OG Image</Label>
                                        <div className="mt-2 space-y-3">
                                            {ogImagePreview && (
                                                <div className="relative w-full h-48 rounded-lg border overflow-hidden">
                                                    <img
                                                        src={ogImagePreview}
                                                        alt="OG Image"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <Input
                                                    type="file"
                                                    ref={ogFileInputRef}
                                                    onChange={handleOGImageUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => ogFileInputRef.current?.click()}
                                                    disabled={uploadingOG}
                                                    className="flex-1"
                                                >
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    {uploadingOG ? "Uploading..." : "Upload OG Image"}
                                                </Button>
                                                <Input
                                                    id="ogImage"
                                                    name="ogImage"
                                                    type="url"
                                                    value={formData.ogImage}
                                                    onChange={handleInputChange}
                                                    placeholder="Or paste OG image URL"
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Variants Tab */}
                            <TabsContent value="variants" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Product variants allow you to sell different sizes, colors, or materials of the same product.
                                        </p>
                                        {editingProduct && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // TODO: Open variant creation dialog
                                                    toast.info("Variant management coming soon");
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Variant
                                            </Button>
                                        )}
                                    </div>
                                    {variants && variants.length > 0 ? (
                                        <div className="border rounded-lg">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>SKU</TableHead>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Price</TableHead>
                                                        <TableHead>Stock</TableHead>
                                                        <TableHead>Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {variants.map((variant) => (
                                                        <TableRow key={variant.id}>
                                                            <TableCell>{variant.sku}</TableCell>
                                                            <TableCell>{variant.name}</TableCell>
                                                            <TableCell>₹{variant.price || formData.price}</TableCell>
                                                            <TableCell>{variant.stockQuantity}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        // TODO: Edit variant
                                                                        toast.info("Variant editing coming soon");
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            {editingProduct ? "No variants yet. Add variants after saving the product." : "Save the product first to add variants."}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Specifications Tab */}
                            <TabsContent value="specs" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Add product specifications (e.g., Material, Weight, Dimensions)
                                        </p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addSpecification}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Specification
                                        </Button>
                                    </div>
                                    {formData.specifications.length > 0 ? (
                                        <div className="space-y-2">
                                            {formData.specifications.map((spec, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <Input
                                                        placeholder="Key (e.g., Material)"
                                                        value={spec.key}
                                                        onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                                                    />
                                                    <Input
                                                        placeholder="Value (e.g., 14k Gold)"
                                                        value={spec.value}
                                                        onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeSpecification(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            No specifications added yet
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <Label htmlFor="weight">Weight (grams)</Label>
                                            <Input
                                                id="weight"
                                                name="weight"
                                                type="number"
                                                step="0.01"
                                                value={formData.weight}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="taxClass">Tax Class</Label>
                                            <Select
                                                value={formData.taxClass}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, taxClass: value }))}
                                            >
                                                <SelectTrigger id="taxClass">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="standard">Standard</SelectItem>
                                                    <SelectItem value="reduced">Reduced</SelectItem>
                                                    <SelectItem value="zero">Zero</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="dimensionsLength">Length</Label>
                                            <Input
                                                id="dimensionsLength"
                                                name="dimensionsLength"
                                                type="number"
                                                step="0.01"
                                                value={formData.dimensionsLength}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="dimensionsWidth">Width</Label>
                                            <Input
                                                id="dimensionsWidth"
                                                name="dimensionsWidth"
                                                type="number"
                                                step="0.01"
                                                value={formData.dimensionsWidth}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="dimensionsHeight">Height</Label>
                                            <Input
                                                id="dimensionsHeight"
                                                name="dimensionsHeight"
                                                type="number"
                                                step="0.01"
                                                value={formData.dimensionsHeight}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="dimensionsUnit">Unit</Label>
                                            <Select
                                                value={formData.dimensionsUnit}
                                                onValueChange={(value) => setFormData(prev => ({ ...prev, dimensionsUnit: value }))}
                                            >
                                                <SelectTrigger id="dimensionsUnit">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cm">cm</SelectItem>
                                                    <SelectItem value="inch">inch</SelectItem>
                                                    <SelectItem value="mm">mm</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Supplier & Returns Tab */}
                            <TabsContent value="supplier" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <h3 className="font-semibold mb-2">Supplier Information</h3>
                                    </div>
                                    <div>
                                        <Label htmlFor="supplierName">Supplier Name</Label>
                                        <Input
                                            id="supplierName"
                                            name="supplierName"
                                            value={formData.supplierName}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Premium Jewelry Co."
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="supplierLocation">Supplier Location</Label>
                                        <Input
                                            id="supplierLocation"
                                            name="supplierLocation"
                                            value={formData.supplierLocation}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Mumbai, India"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="supplierCertification">Certification</Label>
                                        <Input
                                            id="supplierCertification"
                                            name="supplierCertification"
                                            value={formData.supplierCertification}
                                            onChange={handleInputChange}
                                            placeholder="e.g., ISO 9001:2015 Certified"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <h3 className="font-semibold mb-2 mt-4">Return Policy</h3>
                                    </div>
                                    <div>
                                        <Label htmlFor="returnDays">Return Days</Label>
                                        <Input
                                            id="returnDays"
                                            name="returnDays"
                                            type="number"
                                            value={formData.returnDays}
                                            onChange={handleInputChange}
                                            placeholder="7"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="returnPolicy">Return Policy Details</Label>
                                        <Textarea
                                            id="returnPolicy"
                                            name="returnPolicy"
                                            value={formData.returnPolicy}
                                            onChange={handleInputChange}
                                            rows={4}
                                            placeholder="Return policy conditions and terms..."
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Images Tab */}
                            <TabsContent value="images" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Main Image Upload */}
                            <div className="col-span-2">
                                <Label>Main Product Image *</Label>
                                <div className="mt-2 space-y-3">
                                    {mainImagePreview && (
                                        <div className="relative w-full h-48 rounded-lg border overflow-hidden">
                                            <img
                                                src={mainImagePreview}
                                                alt="Main product"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Input
                                            type="file"
                                            ref={mainFileInputRef}
                                            onChange={handleMainImageUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => mainFileInputRef.current?.click()}
                                            disabled={uploadingMain}
                                            className="flex-1"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            {uploadingMain ? "Uploading..." : "Upload Image"}
                                        </Button>
                                        <Input
                                            id="image"
                                            name="image"
                                            type="url"
                                            value={formData.image}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Or paste image URL"
                                            className="flex-1"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Upload an image or paste a URL. Max size: 5MB
                                    </p>
                                </div>
                            </div>

                            {/* Additional Images Upload */}
                            <div className="col-span-2">
                                <Label>Additional Images (Optional)</Label>
                                <div className="mt-2 space-y-3">
                                    {additionalImagePreviews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {additionalImagePreviews.map((url, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={url}
                                                        alt={`Additional ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded border"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdditionalImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        ref={additionalFileInputRef}
                                        onChange={handleAdditionalImagesUpload}
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => additionalFileInputRef.current?.click()}
                                        disabled={uploadingAdditional || additionalImagePreviews.length >= 5}
                                        className="w-full"
                                    >
                                        <ImageIcon className="h-4 w-4 mr-2" />
                                        {uploadingAdditional ? "Uploading..." : "Add More Images"}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Upload up to 5 additional images. Max size: 5MB each
                                    </p>
                                </div>
                            </div>
                            </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || uploadingMain || uploadingAdditional || uploadingOG}>
                                {submitting
                                    ? "Saving..."
                                    : editingProduct
                                        ? "Update Product"
                                        : "Create Product"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            </div>
        </div>
    );
}
