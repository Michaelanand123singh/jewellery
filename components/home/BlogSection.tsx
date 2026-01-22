"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { type BlogPost } from "@/lib/blog-data";

export default function BlogSection() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await apiClient.get<BlogPost[]>("/blogs", { published: "true", limit: 3 });
        if (response.success && response.data) {
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
          setBlogPosts(transformedPosts);
        }
      } catch (error) {
        console.error("Failed to fetch blogs:", error);
        // Fallback to static data
        const { getAllBlogPosts } = await import("@/lib/blog-data");
        setBlogPosts(getAllBlogPosts().slice(0, 3));
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-muted animate-pulse rounded-lg aspect-video" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Blog Posts</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Stay updated with the latest jewelry trends, care tips, and style guides
          </p>
        </motion.div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {blogPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
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

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-10"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background hover:bg-foreground/90 transition-colors font-semibold rounded-none"
          >
            View All Posts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

