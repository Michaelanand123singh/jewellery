"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Calendar, ArrowRight, Search, Tag } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllBlogPosts, getBlogPostsByCategory, type BlogPost } from "@/lib/blog-data";
import { cn } from "@/lib/utils";

const allPosts = getAllBlogPosts();
const categories = Array.from(new Set(allPosts.map((post) => post.category)));

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="flex-grow bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-primary/3 to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Our Blog
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Discover the latest jewelry trends, care tips, style guides, and expert advice
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full border-border/60 hover:border-border focus-visible:border-primary/50 focus-visible:ring-primary/20 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={selectedCategory === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("All")}
                className="rounded-full"
              >
                All
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
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">No articles found</p>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border h-full flex flex-col">
                      {/* Blog Image */}
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <Link href={`/blog/${post.slug}`}>
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </Link>
                        {/* Category Badge */}
                        <div className="absolute top-4 left-4">
                          <span className="bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      {/* Blog Content */}
                      <CardContent className="p-6 flex-grow flex flex-col">
                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <Calendar className="h-4 w-4" />
                          <span>{post.date}</span>
                          {post.readTime && (
                            <>
                              <span>•</span>
                              <span>{post.readTime}</span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <Link href={`/blog/${post.slug}`}>
                          <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                        </Link>

                        {/* Excerpt */}
                        <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
                          {post.excerpt}
                        </p>

                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>

                      {/* Footer */}
                      <CardFooter className="p-6 pt-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="flex items-center gap-2 text-primary hover:gap-3 transition-all font-semibold group/link"
                        >
                          Read More
                          <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

