"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
import { Plus, Trash2, Edit, Package, Upload, X, Image as ImageIcon } from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    originalPrice?: number;
    image: string;
    images?: string[];
    category: string;
    inStock: boolean;
    stockQuantity: number;
    rating?: number;
    reviewCount: number;
}

interface ProductFormData {
    name: string;
    slug: string;
    description: string;
    price: string;
    originalPrice: string;
    image: string;
    images: string;
    category: string;
    inStock: boolean;
    stockQuantity: string;
}

const initialFormData: ProductFormData = {
    name: "",
    slug: "",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    images: "",
    category: "",
    inStock: true,
    stockQuantity: "0",
};

export default function AdminPage() {
    const router = useRouter();
    const { user, checkAuth } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [csrfToken, setCsrfToken] = useState("");

    // Image upload states
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingAdditional, setUploadingAdditional] = useState(false);
    const [mainImagePreview, setMainImagePreview] = useState("");
    const [additionalImagePreviews, setAdditionalImagePreviews] = useState<string[]>([]);
    const mainFileInputRef = useRef<HTMLInputElement>(null);
    const additionalFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (user === null) {
            router.push("/login");
        } else if (user && user.role !== "ADMIN") {
            toast.error("Access denied. Admin privileges required.");
            router.push("/");
        }
    }, [user, router]);

    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchProducts();
            fetchCsrfToken();
        }
    }, [user]);

    const fetchCsrfToken = async () => {
        try {
            const response = await fetch("/api/csrf");
            if (!response.ok) {
                console.error("Failed to fetch CSRF token:", response.statusText);
                return;
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("CSRF endpoint returned non-JSON response");
                return;
            }
            const data = await response.json();
            if (data.success) {
                setCsrfToken(data.token);
            }
        } catch (error) {
            console.error("Failed to fetch CSRF token:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/products?limit=100");
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
                setProducts(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name || "",
                slug: product.slug || "",
                description: product.description || "",
                price: product.price != null ? product.price.toString() : "",
                originalPrice: product.originalPrice != null ? product.originalPrice.toString() : "",
                image: product.image || "",
                images: product.images?.join(", ") || "",
                category: product.category || "",
                inStock: product.inStock ?? true,
                stockQuantity: product.stockQuantity != null ? product.stockQuantity.toString() : "0",
            });
            setMainImagePreview(product.image || "");
            setAdditionalImagePreviews(product.images || []);
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
                console.error("Server response:", text);
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
            const imagesArray = formData.images
                .split(",")
                .map((img) => img.trim())
                .filter((img) => img);

            const productData = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice
                    ? parseFloat(formData.originalPrice)
                    : undefined,
                image: formData.image,
                images: imagesArray,
                category: formData.category,
                inStock: formData.inStock,
                stockQuantity: parseInt(formData.stockQuantity),
            };

            const url = editingProduct
                ? `/api/products/${editingProduct.id}`
                : "/api/products";
            const method = editingProduct ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "x-csrf-token": csrfToken,
                },
                body: JSON.stringify(productData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(
                    editingProduct
                        ? "Product updated successfully"
                        : "Product created successfully"
                );
                handleCloseDialog();
                fetchProducts();
                fetchCsrfToken();
            } else {
                toast.error(data.error || "Failed to save product");
            }
        } catch (error) {
            console.error("Error saving product:", error);
            toast.error("An error occurred while saving the product");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to delete this product?")) {
            return;
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: "DELETE",
                headers: {
                    "x-csrf-token": csrfToken,
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Product deleted successfully");
                fetchProducts();
                fetchCsrfToken();
            } else {
                toast.error(data.error || "Failed to delete product");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("An error occurred while deleting the product");
        }
    };

    if (!user || user.role !== "ADMIN") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">
                        Manage your jewellery products
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Product Management</CardTitle>
                                <CardDescription>
                                    Add, edit, or remove products from your store
                                </CardDescription>
                            </div>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Product
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading products...</p>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-lg font-semibold mb-2">No products yet</p>
                                <p className="text-muted-foreground mb-4">
                                    Get started by adding your first product
                                </p>
                                <Button onClick={() => handleOpenDialog()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Product
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
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
                                                <TableCell>{product.category}</TableCell>
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
                        )}
                    </CardContent>
                </Card>
            </main>
            <Footer />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? "Edit Product" : "Add New Product"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct
                                ? "Update the product details below"
                                : "Fill in the details to create a new product"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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

                            <div className="col-span-2">
                                <Label htmlFor="category">Category *</Label>
                                <Input
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Rings, Necklaces, Earrings"
                                />
                            </div>

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

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting || uploadingMain || uploadingAdditional}>
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
    );
}
