"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Calendar, ArrowRight, Search, Tag, Clock, User } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllBlogPostsFromAPI, type BlogPost } from "@/lib/blog-data";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<BlogPost[]>("/blogs", { published: "true", limit: 100 });
        if (response.success && response.data) {
          // Transform API response to BlogPost format
          const transformedPosts = response.data.map((blog: any) => {
            // Convert string ID to number for compatibility
            const numericId = typeof blog.id === 'string' 
              ? parseInt(blog.id.replace(/\D/g, '').slice(0, 10)) || Math.abs(blog.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0))
              : blog.id;

            return {
              id: numericId,
              title: blog.title,
              excerpt: blog.excerpt,
              image: blog.image,
              date: blog.publishedAt 
                ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : new Date(blog.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
              category: blog.category,
              slug: blog.slug,
              content: blog.content,
              author: blog.author,
              readTime: blog.readTime,
              tags: blog.tags || [],
              faqs: blog.faqs?.map((faq: any) => ({
                question: faq.question,
                answer: faq.answer,
              })) || [],
            };
          });
          setAllPosts(transformedPosts);
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
        // Fallback to static data
        const { getAllBlogPosts } = await import("@/lib/blog-data");
        setAllPosts(getAllBlogPosts());
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(allPosts.map((post) => post.category)));
  }, [allPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allPosts, selectedCategory, searchQuery]);

  return (
    <main className="flex-grow bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 md:py-28 border-b">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Our Blog
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Discover the latest jewelry trends, care tips, style guides, and expert advice from our team
            </p>
            {!loading && (
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span>{allPosts.length} Articles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                  <span>{categories.length} Categories</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search Bar */}
            <div className="w-full lg:w-96">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles, topics, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 rounded-full border-border/60 hover:border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <span className="text-sm font-medium text-muted-foreground mr-2 hidden sm:inline">Filter:</span>
              <Button
                variant={selectedCategory === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("All")}
                className="rounded-full"
              >
                All Posts
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Results Count */}
          {filteredPosts.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
              {selectedCategory !== "All" && ` in ${selectedCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          )}
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-muted animate-pulse rounded-lg aspect-video" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-2xl font-semibold text-foreground mb-2">No articles found</p>
              <p className="text-muted-foreground mb-6">Try adjusting your search or filter criteria</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
                >
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border h-full flex flex-col bg-card hover:border-primary/20">
                    {/* Blog Image */}
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <Link href={`/blog/${post.slug}`} className="block h-full">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </Link>
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-background/95 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-border/50">
                          {post.category}
                        </span>
                      </div>
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Blog Content */}
                    <CardContent className="p-6 flex-grow flex flex-col">
                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{post.date}</span>
                        </div>
                        {post.readTime && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{post.readTime}</span>
                            </div>
                          </>
                        )}
                        {post.author && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              <span>{post.author}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="text-xl sm:text-2xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2 group-hover:underline">
                          {post.title}
                        </h3>
                      </Link>

                      {/* Excerpt */}
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow text-sm leading-relaxed">
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors cursor-default"
                            >
                              <Tag className="h-3 w-3 inline mr-1" />
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs px-2.5 py-1 bg-muted rounded-full text-muted-foreground">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>

                    {/* Footer */}
                    <CardFooter className="p-6 pt-0 mt-auto">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="flex items-center gap-2 text-primary hover:gap-3 transition-all font-semibold group/link w-full"
                      >
                        Read Full Article
                        <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

