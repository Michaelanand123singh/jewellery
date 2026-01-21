"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const blogPosts = [
  {
    id: 1,
    title: "The Ultimate Guide to Choosing the Perfect Engagement Ring",
    excerpt: "Discover everything you need to know about selecting the perfect engagement ring that symbolizes your love and commitment.",
    image: "/img/slider/1.jpg",
    date: "January 15, 2024",
    category: "Jewelry Guide",
    slug: "ultimate-guide-engagement-ring",
  },
  {
    id: 2,
    title: "Caring for Your Gold Jewelry: Tips and Tricks",
    excerpt: "Learn how to maintain the shine and beauty of your gold jewelry with these expert care tips and maintenance guidelines.",
    image: "/img/slider/2.jpg",
    date: "January 10, 2024",
    category: "Care Tips",
    slug: "caring-for-gold-jewelry",
  },
  {
    id: 3,
    title: "Trending Jewelry Styles for 2024",
    excerpt: "Explore the latest jewelry trends and styles that are making waves in 2024, from minimalist designs to statement pieces.",
    image: "/img/slider/3.jpg",
    date: "January 5, 2024",
    category: "Trends",
    slug: "trending-jewelry-styles-2024",
  },
];

export default function BlogSection() {
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

