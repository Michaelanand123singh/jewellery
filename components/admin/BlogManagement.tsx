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

    // Image upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState("");
    const imageFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user?.role === "ADMIN") {
            fetchBlogs();
        }
    }, [user]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/v1/blogs?limit=100");
            if (!response.ok) {
                console.error("Failed to fetch blogs:", response.statusText);
                toast.error("Failed to load blogs");
                return;
            }
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Blogs endpoint returned non-JSON response");
                toast.error("Failed to load blogs");
                return;
            }
            const data = await response.json();
            if (data.success) {
                setBlogs(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch blogs:", error);
            toast.error("Failed to load blogs");
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
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
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
        setSubmitting(true);

        try {
            const tagsArray = formData.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag);

            const blogData = {
                title: formData.title,
                slug: formData.slug,
                excerpt: formData.excerpt,
                content: formData.content || undefined,
                image: formData.image,
                category: formData.category,
                author: formData.author || undefined,
                readTime: formData.readTime || undefined,
                tags: tagsArray,
                published: formData.published,
                publishedAt: formData.published ? new Date().toISOString() : undefined,
                faqs: formData.faqs.filter((faq) => faq.question && faq.answer),
            };

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
                toast.error(response.error || "Failed to save blog");
            }
        } catch (error: any) {
            console.error("Error saving blog:", error);
            toast.error(error.message || "Failed to save blog");
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Blog Management</CardTitle>
                            <CardDescription>
                                Add, edit, or remove blog posts from your website
                            </CardDescription>
                        </div>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Blog
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">Loading blogs...</p>
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-lg font-semibold mb-2">No blogs yet</p>
                            <p className="text-muted-foreground mb-4">
                                Get started by adding your first blog post
                            </p>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Blog
                            </Button>
                        </div>
                    ) : (
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
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        <div className="grid grid-cols-2 gap-4">
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

