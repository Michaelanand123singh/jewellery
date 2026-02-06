"use client";

import React, { useState, useEffect, Fragment } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  children?: Category[];
  order: number;
  isActive: boolean;
  showInNav: boolean;
  navOrder: number;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string;
  order: string;
  isActive: boolean;
  showInNav: boolean;
  navOrder: string;
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentId: "",
    order: "0",
    isActive: true,
    showInNav: false,
    navOrder: "0",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Category[]>("/categories", { tree: "true" });
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description || undefined,
        image: formData.image || undefined,
        parentId: formData.parentId || null,
        order: parseInt(formData.order) || 0,
        isActive: formData.isActive,
        showInNav: formData.showInNav,
        navOrder: parseInt(formData.navOrder) || 0,
      };

      if (editingCategory) {
        // Relative path – apiClient adds /api/v1
        await apiClient.put(`/categories/${editingCategory.id}`, payload);
        toast.success("Category updated successfully");
      } else {
        // Relative path – apiClient adds /api/v1
        await apiClient.post("/categories", payload);
        toast.success("Category created successfully");
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      parentId: category.parentId || "",
      order: category.order.toString(),
      isActive: category.isActive,
      showInNav: category.showInNav,
      navOrder: category.navOrder.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      // Relative path – apiClient adds /api/v1
      await apiClient.delete(`/categories/${id}`);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "",
      order: "0",
      isActive: true,
      showInNav: false,
      navOrder: "0",
    });
    setEditingCategory(null);
  };

  const renderCategoryRow = (category: Category, level: number = 0): React.ReactElement => {
    return (
      <Fragment key={category.id}>
        <TableRow>
          <TableCell style={{ paddingLeft: `${level * 2 + 1}rem` }}>
            <div className="flex items-center gap-2">
              {level > 0 && <span className="text-muted-foreground">└─</span>}
              <span className="font-medium">{category.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <code className="text-xs bg-muted px-2 py-1 rounded">{category.slug}</code>
          </TableCell>
          <TableCell>{category.order}</TableCell>
          <TableCell>
            <Badge variant={category.isActive ? "default" : "secondary"}>
              {category.isActive ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {category.children?.map((child) => renderCategoryRow(child, level + 1))}
      </Fragment>
    );
  };

  const rootCategories = categories.filter((cat) => !cat.parentId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Categories</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage product categories and subcategories
              </CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }} size="sm" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rootCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    rootCategories.map((category) => renderCategoryRow(category))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category information"
                : "Add a new category to organize your products"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generated from name"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to auto-generate from name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="parentId">Parent Category</Label>
                  <Select
                    // Use a non-empty sentinel value for "no parent" to satisfy Radix Select
                    value={formData.parentId !== "" ? formData.parentId : "root"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, parentId: value === "root" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (Root Category)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">None (Root Category)</SelectItem>
                      {categories
                        .filter((cat) => !editingCategory || cat.id !== editingCategory.id)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Active
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showInNav"
                  checked={formData.showInNav}
                  onChange={(e) => setFormData({ ...formData, showInNav: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="showInNav" className="cursor-pointer">
                  Show in main navigation
                </Label>
              </div>

              {formData.showInNav && (
                <div className="space-y-2">
                  <Label htmlFor="navOrder">Navigation Order</Label>
                  <Input
                    id="navOrder"
                    type="number"
                    min="0"
                    value={formData.navOrder}
                    onChange={(e) => setFormData({ ...formData, navOrder: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? "Update" : "Create"} Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

