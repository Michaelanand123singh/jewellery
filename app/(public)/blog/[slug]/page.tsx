"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ArrowLeft, Share2, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getBlogPostBySlug, getAllBlogPosts, type BlogPost } from "@/lib/blog-data";
import { cn } from "@/lib/utils";
import TableOfContents from "@/components/blog/TableOfContents";
import { useEffect, useRef } from "react";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const post = getBlogPostBySlug(slug);
  const allPosts = getAllBlogPosts();
  const contentRef = useRef<HTMLDivElement>(null);

  if (!post) {
    router.push("/blog");
    return null;
  }

  // Get related posts (same category, excluding current post)
  const relatedPosts = allPosts
    .filter((p) => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  // Add IDs to headings in content after render
  useEffect(() => {
    if (!post.content) return;

    const addIdsToHeadings = () => {
      const headings = document.querySelectorAll(".blog-content h2, .blog-content h3");
      headings.forEach((heading, index) => {
        if (!heading.id) {
          const text = heading.textContent || "";
          const id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          heading.id = id;
        }
      });
    };

    // Wait for content to render, then add IDs
    const timeout = setTimeout(addIdsToHeadings, 100);
    return () => clearTimeout(timeout);
  }, [post.content]);

  return (
    <main className="flex-grow bg-background">
      {/* Hero Image */}
      <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="secondary"
            size="sm"
            asChild
            className="bg-background/90 backdrop-blur-sm hover:bg-background"
          >
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        {/* Category Badge */}
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-background/90 backdrop-blur-sm text-foreground text-sm font-semibold px-4 py-2 rounded-full">
            {post.category}
          </span>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 drop-shadow-lg">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-foreground/90">
                {post.author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{post.date}</span>
                </div>
                {post.readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{post.readTime}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 lg:gap-12">
            {/* Table of Contents - Desktop Sidebar */}
            {post.content && <TableOfContents content={post.content} />}

            {/* Main Content */}
            <div className="flex-1 max-w-3xl mx-auto lg:mx-0">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-medium"
                  >
                    <Tag className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Article Body */}
            <div className="blog-content">
              <div
                ref={contentRef}
                className="
                  [&>p]:text-base md:[&>p]:text-lg lg:[&>p]:text-xl
                  [&>p]:text-muted-foreground 
                  [&>p]:leading-[1.75] md:[&>p]:leading-[1.85]
                  [&>p]:mb-6 md:[&>p]:mb-8
                  [&>p:first-of-type]:text-lg md:[&>p:first-of-type]:text-xl lg:[&>p:first-of-type]:text-2xl
                  [&>p:first-of-type]:font-medium [&>p:first-of-type]:text-foreground
                  [&>p:first-of-type]:leading-relaxed [&>p:first-of-type]:mb-8 md:[&>p:first-of-type]:mb-10
                  
                  [&>h2]:text-2xl md:[&>h2]:text-3xl lg:[&>h2]:text-4xl
                  [&>h2]:font-bold [&>h2]:text-foreground
                  [&>h2]:mt-12 md:[&>h2]:mt-16 [&>h2]:mb-5 md:[&>h2]:mb-7
                  [&>h2]:pt-4 [&>h2]:border-t-2 [&>h2]:border-border
                  [&>h2]:first:mt-0 [&>h2]:first:pt-0 [&>h2]:first:border-0
                  [&>h2]:scroll-mt-24
                  
                  [&>h3]:text-xl md:[&>h3]:text-2xl lg:[&>h3]:text-3xl
                  [&>h3]:font-semibold [&>h3]:text-foreground
                  [&>h3]:mt-10 md:[&>h3]:mt-12 [&>h3]:mb-4 md:[&>h3]:mb-6
                  [&>h3]:scroll-mt-24
                  
                  [&>ul]:list-none [&>ul]:space-y-4 md:[&>ul]:space-y-5
                  [&>ul]:my-8 md:[&>ul]:my-10
                  [&>ul]:pl-0
                  [&>ul>li]:relative
                  [&>ul>li]:pl-6 md:[&>ul>li]:pl-7
                  [&>ul>li]:text-base md:[&>ul>li]:text-lg
                  [&>ul>li]:text-muted-foreground
                  [&>ul>li]:leading-[1.75]
                  [&>ul>li]:before:absolute [&>ul>li]:before:left-0
                  [&>ul>li]:before:content-[''] [&>ul>li]:before:w-2 [&>ul>li]:before:h-2
                  [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-primary
                  [&>ul>li]:before:top-2.5 [&>ul>li]:before:flex-shrink-0
                  [&>ul>li>strong]:text-foreground [&>ul>li>strong]:font-semibold
                  [&>ul>li>strong]:inline
                  
                  [&>ol]:list-decimal [&>ol]:space-y-4 md:[&>ol]:space-y-5
                  [&>ol]:my-8 md:[&>ol]:my-10 
                  [&>ol]:pl-6 md:[&>ol]:pl-8
                  [&>ol>li]:text-base md:[&>ol>li]:text-lg
                  [&>ol>li]:text-muted-foreground
                  [&>ol>li]:leading-[1.75] [&>ol>li]:pl-3
                  [&>ol>li>strong]:text-foreground [&>ol>li>strong]:font-semibold
                  [&>ol>li>strong]:inline
                  
                  [&>strong]:font-semibold [&>strong]:text-foreground
                  
                  [&>a]:text-primary [&>a]:underline [&>a]:underline-offset-4
                  [&>a]:decoration-primary/50
                  [&>a]:hover:text-primary/80 [&>a]:hover:decoration-primary
                  [&>a]:transition-colors
                  
                  [&>blockquote]:border-l-4 [&>blockquote]:border-primary/40
                  [&>blockquote]:pl-6 md:[&>blockquote]:pl-8
                  [&>blockquote]:py-5 md:[&>blockquote]:py-6
                  [&>blockquote]:my-10 md:[&>blockquote]:my-12
                  [&>blockquote]:bg-muted/50 [&>blockquote]:rounded-r-lg
                  [&>blockquote]:italic [&>blockquote]:text-muted-foreground
                  [&>blockquote]:text-base md:[&>blockquote]:text-lg
                  [&>blockquote]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }}
              />
            </div>

            {/* Share Section */}
            <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
                <div className="flex-1">
                  <p className="text-sm md:text-base font-semibold mb-3 text-foreground">Share this article</p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: post.title,
                            text: post.excerpt,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }
                      }}
                      className="rounded-full"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/blog" className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back to Blog</span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* FAQ Section */}
            {post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0 && (
              <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-border">
                <div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8 text-foreground">
                    Frequently Asked Questions
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {post.faqs.map((faq, index) => (
                      <AccordionItem key={`faq-item-${index}`} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left text-base md:text-lg font-semibold">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-base md:text-lg text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Related Articles</h2>
              <p className="text-muted-foreground">Continue reading with these related posts</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedPosts.map((relatedPost, index) => (
                <motion.div
                  key={relatedPost.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border h-full flex flex-col">
                    <div className="relative aspect-video overflow-hidden bg-muted">
                      <Link href={`/blog/${relatedPost.slug}`}>
                        <Image
                          src={relatedPost.image}
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </Link>
                      <div className="absolute top-4 left-4">
                        <span className="bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-3 py-1 rounded-full">
                          {relatedPost.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-grow flex flex-col">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{relatedPost.date}</span>
                      </div>
                      <Link href={`/blog/${relatedPost.slug}`}>
                        <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                      </Link>
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
                        {relatedPost.excerpt}
                      </p>
                      <Link
                        href={`/blog/${relatedPost.slug}`}
                        className="text-primary hover:underline font-semibold text-sm"
                      >
                        Read More →
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

