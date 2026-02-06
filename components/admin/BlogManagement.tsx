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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Edit, FileText, Upload, X, Image as ImageIcon } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BlogFAQ {
    id?: string;
    question: string;
    answer: string;
}

interface Blog {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content?: string;
    image: string;
    category: string;
    author?: string;
    readTime?: string;
    tags: string[];
    published: boolean;
    publishedAt?: string;
    faqs?: BlogFAQ[];
    createdAt: string;
    updatedAt: string;
}

interface BlogFormData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    author: string;
    readTime: string;
    tags: string;
    published: boolean;
    faqs: BlogFAQ[];
}

const BLOG_CATEGORIES = [
    "Jewelry Guide",
    "Care Tips",
    "Trends",
    "Style Guide",
    "News",
    "Tutorials",
];

const initialFormData: BlogFormData = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    category: "",
    author: "",
    readTime: "",
    tags: "",
    published: false,
    faqs: [],
};

export default function BlogManagement() {
    const { user } = useAuthStore();
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
    const [formData, setFormData] = useState<BlogFormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(20); // Fixed limit per page
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    
    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [publishedFilter, setPublishedFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Image upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const imageFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchBlogs();
        }
    }, [user]);

    // Refetch blogs when page, search, or filters change
    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchBlogs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, page, searchQuery, publishedFilter, categoryFilter]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            
            // Build query parameters
            const params: Record<string, string> = {
                page: page.toString(),
                limit: limit.toString(),
            };

            // Add search query if provided
            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            // Add published filter if not "all"
            if (publishedFilter !== "all") {
                params.published = publishedFilter === "published" ? "true" : "false";
            }

            // Add category filter if not "all"
            if (categoryFilter !== "all") {
                params.category = categoryFilter;
            }

            const response = await apiClient.get<Blog[]>("/blogs", params);
            if (response.success && response.data) {
                setBlogs(response.data);
                
                // Update pagination metadata
                if (response.meta) {
                    setTotal(response.meta.total || 0);
                    setTotalPages(response.meta.totalPages || 0);
                } else {
                    // Fallback: calculate from results
                    const blogCount = response.data?.length || 0;
                    setTotal(blogCount);
                    setTotalPages(Math.ceil(blogCount / limit));
                }
            } else {
                toast.error(response.error || "Failed to load blogs");
            }
        } catch (error: any) {
            console.error("Failed to fetch blogs:", error);
            toast.error(error.message || "Failed to load blogs");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (blog?: Blog) => {
        if (blog) {
            setEditingBlog(blog);
            setFormData({
                title: blog.title || "",
                slug: blog.slug || "",
                excerpt: blog.excerpt || "",
                content: blog.content || "",
                image: blog.image || "",
                category: blog.category || "",
                author: blog.author || "",
                readTime: blog.readTime || "",
                tags: blog.tags?.join(", ") || "",
                published: blog.published ?? false,
                faqs: blog.faqs?.map((faq: any) => ({
                    question: faq.question || "",
                    answer: faq.answer || "",
                })) || [],
            });
            setImagePreview(blog.image || "");
        } else {
            setEditingBlog(null);
            setFormData(initialFormData);
            setImagePreview("");
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingBlog(null);
        setFormData(initialFormData);
        setImagePreview("");
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

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setFormData((prev) => ({
            ...prev,
            title,
            slug: generateSlug(title),
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'blogs');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                if (data.success) {
                    setFormData(prev => ({ ...prev, image: data.data.url }));
                    setImagePreview(data.data.url);
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
            setUploadingImage(false);
        }
    };

    const handleAddFAQ = () => {
        setFormData((prev) => ({
            ...prev,
            faqs: [...prev.faqs, { question: "", answer: "" }],
        }));
    };

    const handleRemoveFAQ = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            faqs: prev.faqs.filter((_, i) => i !== index),
        }));
    };

    const handleFAQChange = (index: number, field: "question" | "answer", value: string) => {
        setFormData((prev) => {
            const newFAQs = [...prev.faqs];
            newFAQs[index] = { ...newFAQs[index], [field]: value };
            return { ...prev, faqs: newFAQs };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.image || formData.image.trim() === '') {
            toast.error('Please upload a blog image');
            return;
        }
        
        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }
        
        if (!formData.slug.trim()) {
            toast.error('Slug is required');
            return;
        }
        
        if (!formData.excerpt.trim()) {
            toast.error('Excerpt is required');
            return;
        }
        
        if (!formData.category) {
            toast.error('Category is required');
            return;
        }

        setSubmitting(true);

        try {
            const tagsArray = formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);

            // Prepare blog data
            const blogData: any = {
                title: formData.title.trim(),
                slug: formData.slug.trim(),
                excerpt: formData.excerpt.trim(),
                content: formData.content?.trim() || undefined,
                image: formData.image.trim(),
                category: formData.category,
                author: formData.author?.trim() || undefined,
                readTime: formData.readTime?.trim() || undefined,
                tags: tagsArray,
                published: formData.published,
                faqs: formData.faqs.filter((faq) => faq.question && faq.answer),
            };

            // Handle publishedAt - only set if publishing for the first time or changing published status
            if (editingBlog) {
                // When updating, only set publishedAt if:
                // 1. Changing from unpublished to published
                // 2. Or if already published and we want to keep it published (don't change publishedAt)
                if (formData.published && !editingBlog.published) {
                    // Changing from draft to published
                    blogData.publishedAt = new Date().toISOString();
                } else if (!formData.published) {
                    // Changing to draft - clear publishedAt
                    blogData.publishedAt = null;
                }
                // If already published and staying published, don't send publishedAt to preserve original date
            } else {
                // Creating new blog
                if (formData.published) {
                    blogData.publishedAt = new Date().toISOString();
                }
            }

            let response;
            if (editingBlog) {
                response = await apiClient.put(`/blogs/${editingBlog.id}`, blogData);
            } else {
                response = await apiClient.post("/blogs", blogData);
            }

            if (response.success) {
                toast.success(
                    editingBlog ? "Blog updated successfully" : "Blog created successfully"
                );
                handleCloseDialog();
                fetchBlogs();
            } else {
                // Handle validation errors from backend
                const errorMessage = response.error || "Failed to save blog";
                if (response.errors && Array.isArray(response.errors)) {
                    // Multiple validation errors
                    response.errors.forEach((err: any) => {
                        toast.error(err.message || err.path || "Validation error");
                    });
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch (error: any) {
            console.error("Error saving blog:", error);
            // Handle Zod validation errors
            if (error.errors && Array.isArray(error.errors)) {
                error.errors.forEach((err: any) => {
                    const field = err.path?.join('.') || 'field';
                    toast.error(`${field}: ${err.message}`);
                });
            } else {
                toast.error(error.message || "Failed to save blog");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (blogId: string) => {
        if (!confirm("Are you sure you want to delete this blog?")) {
            return;
        }

        try {
            const response = await apiClient.delete(`/blogs/${blogId}`);
            if (response.success) {
                toast.success("Blog deleted successfully");
                fetchBlogs();
            } else {
                toast.error(response.error || "Failed to delete blog");
            }
        } catch (error: any) {
            console.error("Error deleting blog:", error);
            toast.error(error.message || "Failed to delete blog");
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl sm:text-2xl">Blog Management</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                Add, edit, or remove blog posts from your website
                            </CardDescription>
                        </div>
                        <Button onClick={() => handleOpenDialog()} size="sm" className="w-full sm:w-auto">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Blog
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search and Filters */}
                    <div className="mb-6 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <Input
                                    placeholder="Search blogs by title, content, or author..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setPage(1); // Reset to first page on search
                                    }}
                                    className="w-full"
                                />
                            </div>
                            <Select value={publishedFilter} onValueChange={(value) => {
                                setPublishedFilter(value);
                                setPage(1); // Reset to first page on filter change
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading blogs...</p>
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-semibold mb-2">No blogs found</p>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery || publishedFilter !== "all"
                                    ? "Try adjusting your search or filters"
                                    : "Get started by adding your first blog post"}
                            </p>
                            {!searchQuery && publishedFilter === "all" && (
                                <Button onClick={() => handleOpenDialog()}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Blog
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
                                        <TableHead className="min-w-[200px]">Title</TableHead>
                                        <TableHead className="min-w-[100px]">Category</TableHead>
                                        <TableHead className="min-w-[100px]">Author</TableHead>
                                        <TableHead className="min-w-[100px]">Status</TableHead>
                                        <TableHead className="min-w-[100px]">Date</TableHead>
                                        <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {blogs.map((blog) => (
                                        <TableRow key={blog.id}>
                                            <TableCell>
                                                <img
                                                    src={blog.image}
                                                    alt={blog.title}
                                                    className="h-12 w-12 object-cover rounded"
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {blog.title}
                                            </TableCell>
                                            <TableCell>{blog.category}</TableCell>
                                            <TableCell>{blog.author || "N/A"}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        blog.published
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {blog.published ? "Published" : "Draft"}
                                                </span>
                                            </TableCell>
                                            <TableCell>{formatDate(blog.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(blog)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(blog.id)}
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
                                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} blogs
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
                        <DialogTitle>
                            {editingBlog ? "Edit Blog" : "Add New Blog"}
                        </DialogTitle>
                        <DialogDescription>
                            {editingBlog
                                ? "Update the blog details below"
                                : "Fill in the details to create a new blog post"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    required
                                    placeholder="e.g., The Ultimate Guide to Choosing the Perfect Engagement Ring"
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
                                    placeholder="e.g., ultimate-guide-engagement-ring"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Auto-generated from title
                                </p>
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="excerpt">Excerpt *</Label>
                                <Textarea
                                    id="excerpt"
                                    name="excerpt"
                                    value={formData.excerpt}
                                    onChange={handleInputChange}
                                    required
                                    rows={3}
                                    placeholder="Brief description of the blog post..."
                                />
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="content">Content</Label>
                                <Textarea
                                    id="content"
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    rows={10}
                                    placeholder="Full blog content (HTML supported)..."
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="col-span-2">
                                <Label>Blog Image *</Label>
                                <div className="mt-2 space-y-3">
                                    {imagePreview && (
                                        <div className="relative w-full h-48 rounded-lg border overflow-hidden">
                                            <img
                                                src={imagePreview}
                                                alt="Blog preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <Input
                                            ref={imageFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => imageFileInputRef.current?.click()}
                                            disabled={uploadingImage}
                                        >
                                            {uploadingImage ? (
                                                <>
                                                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="h-4 w-4 mr-2" />
                                                    Upload Image
                                                </>
                                            )}
                                        </Button>
                                        {imagePreview && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setImagePreview("");
                                                    setFormData((prev) => ({ ...prev, image: "" }));
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                    {formData.image && (
                                        <Input
                                            type="text"
                                            value={formData.image}
                                            onChange={(e) =>
                                                setFormData((prev) => ({ ...prev, image: e.target.value }))
                                            }
                                            placeholder="Or enter image URL directly"
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) =>
                                        setFormData((prev) => ({ ...prev, category: value }))
                                    }
                                    required
                                >
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BLOG_CATEGORIES.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="author">Author</Label>
                                <Input
                                    id="author"
                                    name="author"
                                    value={formData.author}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Sarah Johnson"
                                />
                            </div>

                            <div>
                                <Label htmlFor="readTime">Read Time</Label>
                                <Input
                                    id="readTime"
                                    name="readTime"
                                    value={formData.readTime}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 8 min read"
                                />
                            </div>

                            <div>
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    placeholder="Comma-separated tags"
                                />
                            </div>

                            <div className="col-span-2 flex items-center space-x-2">
                                <Checkbox
                                    id="published"
                                    checked={formData.published}
                                    onCheckedChange={(checked) =>
                                        setFormData((prev) => ({ ...prev, published: checked as boolean }))
                                    }
                                />
                                <Label htmlFor="published" className="cursor-pointer">
                                    Publish immediately
                                </Label>
                            </div>

                            {/* FAQs Section */}
                            <div className="col-span-2">
                                <div className="flex items-center justify-between mb-2">
                                    <Label>FAQs</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleAddFAQ}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add FAQ
                                    </Button>
                                </div>
                                <div className="space-y-3 border rounded-lg p-4">
                                    {formData.faqs.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No FAQs added. Click "Add FAQ" to add one.
                                        </p>
                                    ) : (
                                        formData.faqs.map((faq, index) => (
                                            <div key={index} className="border rounded p-3 space-y-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">FAQ {index + 1}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveFAQ(index)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div>
                                                    <Label>Question</Label>
                                                    <Input
                                                        value={faq.question}
                                                        onChange={(e) =>
                                                            handleFAQChange(index, "question", e.target.value)
                                                        }
                                                        placeholder="Enter question..."
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Answer</Label>
                                                    <Textarea
                                                        value={faq.answer}
                                                        onChange={(e) =>
                                                            handleFAQChange(index, "answer", e.target.value)
                                                        }
                                                        rows={2}
                                                        placeholder="Enter answer..."
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
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
                            <Button type="submit" disabled={submitting}>
                                {submitting
                                    ? "Saving..."
                                    : editingBlog
                                        ? "Update Blog"
                                        : "Create Blog"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

