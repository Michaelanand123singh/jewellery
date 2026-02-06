"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, ArrowLeft, Share2, Tag, User, Facebook, Twitter, Linkedin, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiClient } from "@/lib/api-client";
import { type BlogPost } from "@/lib/blog-data";
import { cn } from "@/lib/utils";
import TableOfContents from "@/components/blog/TableOfContents";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get related posts (same category, excluding current post)
  // MUST be called before any early returns to follow Rules of Hooks
  const relatedPosts = useMemo(() => {
    if (!post || allPosts.length === 0) return [];
    return allPosts
      .filter((p) => p.category === post.category && p.id !== post.id)
      .slice(0, 3);
  }, [post, allPosts]);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        interface BlogResponse {
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
          createdAt: string;
          faqs?: Array<{ question: string; answer: string }>;
        }

        const response = await apiClient.get<BlogResponse>(`/blogs/slug/${slug}`);
        if (response.success && response.data) {
          const blog = response.data;
          // Convert string ID to number for compatibility
          const numericId = typeof blog.id === 'string' 
            ? parseInt(blog.id.replace(/\D/g, '').slice(0, 10)) || Math.abs(blog.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0))
            : blog.id;

          const transformedPost: BlogPost = {
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
          setPost(transformedPost);

          // Fetch all posts for related posts
          const allResponse = await apiClient.get<BlogPost[]>("/blogs", { published: "true", limit: 100 });
          if (allResponse.success && allResponse.data) {
            const transformedPosts = allResponse.data.map((blog: any) => {
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
        } else {
          router.push("/blog");
        }
      } catch (error) {
        console.error("Failed to fetch blog:", error);
        router.push("/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug, router]);

  // Add IDs to headings in content after render
  // MUST be called before any early returns to follow Rules of Hooks
  useEffect(() => {
    if (!post?.content) return;

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
  }, [post?.content]);

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = post?.title || "";
    const text = post?.excerpt || "";

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
      return;
    }

    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      return;
    }

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
      return;
    }

    if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
      return;
    }

    // Native share API
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy
      handleShare('copy');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Hero Skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-muted rounded-lg w-3/4 animate-pulse"></div>
              <div className="h-6 bg-muted rounded-lg w-1/2 animate-pulse"></div>
              <div className="h-[400px] bg-muted rounded-xl animate-pulse"></div>
            </div>
            {/* Content Skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-4/5 animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section with Image */}
      <section className="relative w-full h-[50vh] min-h-[400px] max-h-[600px] overflow-hidden">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        {/* Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-background/95 backdrop-blur-md hover:bg-background border border-border/50 shadow-sm"
              >
                <Link href="/blog" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Blog</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>

              <span className="bg-background/95 backdrop-blur-md text-foreground text-sm font-semibold px-4 py-2 rounded-full border border-border/50 shadow-sm">
                {post.category}
              </span>
            </div>
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="container mx-auto px-4 pb-8 md:pb-12">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-4"
              >
                <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight drop-shadow-lg">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm md:text-base text-foreground/90">
                  {post.author && (
                    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{post.author}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>
                  {post.readTime && (
                    <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-16">
              {/* Table of Contents - Desktop Sidebar */}
              {post.content && (
                <aside className="hidden lg:block lg:w-64 xl:w-72 flex-shrink-0">
                  <div className="sticky top-24">
                    <TableOfContents content={post.content} />
                  </div>
                </aside>
              )}

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                <div className="max-w-3xl mx-auto lg:mx-0">
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8 md:mb-10">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 hover:bg-primary/15 transition-colors"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Article Body */}
                  <div className="blog-content prose prose-lg md:prose-xl lg:prose-2xl max-w-none">
                    <div
                      ref={contentRef}
                      className="
                        [&>p]:text-base md:[&>p]:text-lg lg:[&>p]:text-xl
                        [&>p]:text-muted-foreground 
                        [&>p]:leading-relaxed md:[&>p]:leading-[1.8]
                        [&>p]:mb-6 md:[&>p]:mb-8
                        [&>p:first-of-type]:text-xl md:[&>p:first-of-type]:text-2xl lg:[&>p:first-of-type]:text-3xl
                        [&>p:first-of-type]:font-medium [&>p:first-of-type]:text-foreground
                        [&>p:first-of-type]:leading-relaxed [&>p:first-of-type]:mb-8 md:[&>p:first-of-type]:mb-12
                        [&>p:first-of-type]:tracking-tight
                        
                        [&>h2]:text-3xl md:[&>h2]:text-4xl lg:[&>h2]:text-5xl
                        [&>h2]:font-bold [&>h2]:text-foreground
                        [&>h2]:mt-16 md:[&>h2]:mt-20 [&>h2]:mb-6 md:[&>h2]:mb-8
                        [&>h2]:pt-6 [&>h2]:border-t-2 [&>h2]:border-border
                        [&>h2]:first:mt-0 [&>h2]:first:pt-0 [&>h2]:first:border-0
                        [&>h2]:scroll-mt-24
                        [&>h2]:tracking-tight
                        
                        [&>h3]:text-2xl md:[&>h3]:text-3xl lg:[&>h3]:text-4xl
                        [&>h3]:font-semibold [&>h3]:text-foreground
                        [&>h3]:mt-12 md:[&>h3]:mt-16 [&>h3]:mb-5 md:[&>h3]:mb-7
                        [&>h3]:scroll-mt-24
                        [&>h3]:tracking-tight
                        
                        [&>ul]:list-none [&>ul]:space-y-4 md:[&>ul]:space-y-5
                        [&>ul]:my-10 md:[&>ul]:my-12
                        [&>ul]:pl-0
                        [&>ul>li]:relative
                        [&>ul>li]:pl-7 md:[&>ul>li]:pl-8
                        [&>ul>li]:text-base md:[&>ul>li]:text-lg
                        [&>ul>li]:text-muted-foreground
                        [&>ul>li]:leading-relaxed
                        [&>ul>li]:before:absolute [&>ul>li]:before:left-0
                        [&>ul>li]:before:content-[''] [&>ul>li]:before:w-2.5 [&>ul>li]:before:h-2.5
                        [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-primary
                        [&>ul>li]:before:top-2.5 [&>ul>li]:before:flex-shrink-0
                        [&>ul>li>strong]:text-foreground [&>ul>li>strong]:font-semibold
                        [&>ul>li>strong]:inline
                        
                        [&>ol]:list-decimal [&>ol]:space-y-4 md:[&>ol]:space-y-5
                        [&>ol]:my-10 md:[&>ol]:my-12 
                        [&>ol]:pl-6 md:[&>ol]:pl-8
                        [&>ol>li]:text-base md:[&>ol>li]:text-lg
                        [&>ol>li]:text-muted-foreground
                        [&>ol>li]:leading-relaxed [&>ol>li]:pl-3
                        [&>ol>li>strong]:text-foreground [&>ol>li>strong]:font-semibold
                        [&>ol>li>strong]:inline
                        
                        [&>strong]:font-semibold [&>strong]:text-foreground
                        
                        [&>a]:text-primary [&>a]:underline [&>a]:underline-offset-4
                        [&>a]:decoration-primary/50
                        [&>a]:hover:text-primary/80 [&>a]:hover:decoration-primary
                        [&>a]:transition-colors
                        [&>a]:font-medium
                        
                        [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50
                        [&>blockquote]:pl-8 md:[&>blockquote]:pl-10
                        [&>blockquote]:py-6 md:[&>blockquote]:py-8
                        [&>blockquote]:my-12 md:[&>blockquote]:my-16
                        [&>blockquote]:bg-muted/50 [&>blockquote]:rounded-r-lg
                        [&>blockquote]:italic [&>blockquote]:text-muted-foreground
                        [&>blockquote]:text-lg md:[&>blockquote]:text-xl
                        [&>blockquote]:leading-relaxed
                        [&>blockquote]:font-medium
                        
                        [&>img]:rounded-xl [&>img]:my-10 md:[&>img]:my-12
                        [&>img]:shadow-lg
                        
                        [&>code]:bg-muted [&>code]:px-2 [&>code]:py-1 [&>code]:rounded
                        [&>code]:text-sm [&>code]:font-mono
                        
                        [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg
                        [&>pre]:overflow-x-auto [&>pre]:my-8
                      "
                      dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }}
                    />
                  </div>

                  {/* Share Section */}
                  <div className="mt-16 md:mt-20 pt-10 md:pt-12 border-t-2 border-border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold mb-4 text-foreground">
                          Share this article
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('facebook')}
                            className="rounded-full gap-2"
                          >
                            <Facebook className="h-4 w-4" />
                            <span className="hidden sm:inline">Facebook</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('twitter')}
                            className="rounded-full gap-2"
                          >
                            <Twitter className="h-4 w-4" />
                            <span className="hidden sm:inline">Twitter</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('linkedin')}
                            className="rounded-full gap-2"
                          >
                            <Linkedin className="h-4 w-4" />
                            <span className="hidden sm:inline">LinkedIn</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare('copy')}
                            className="rounded-full gap-2"
                          >
                            {copied ? (
                              <>
                                <Check className="h-4 w-4" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                <span className="hidden sm:inline">Copy Link</span>
                                <span className="sm:hidden">Copy</span>
                              </>
                            )}
                          </Button>
                          {typeof navigator !== 'undefined' && 'share' in navigator && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShare()}
                              className="rounded-full gap-2"
                            >
                              <Share2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Share</span>
                            </Button>
                          )}
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
                    <div className="mt-16 md:mt-20 pt-10 md:pt-12 border-t-2 border-border">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-foreground tracking-tight">
                            Frequently Asked Questions
                          </h2>
                          <p className="text-muted-foreground text-lg">
                            Find answers to common questions about this topic
                          </p>
                        </div>
                        <Accordion type="single" collapsible className="w-full space-y-4">
                          {post.faqs.map((faq, index) => (
                            <AccordionItem 
                              key={`faq-item-${index}`} 
                              value={`faq-${index}`}
                              className="border border-border rounded-lg px-6 py-2 bg-card hover:bg-muted/50 transition-colors"
                            >
                              <AccordionTrigger className="text-left text-base md:text-lg font-semibold py-4 hover:no-underline">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-base md:text-lg text-muted-foreground leading-relaxed pb-4 pt-2">
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
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-20 lg:py-24 bg-muted/30 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="mb-12 md:mb-16 text-center"
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground tracking-tight">
                  Related Articles
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                  Continue reading with these related posts
                </p>
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
                    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border h-full flex flex-col bg-card">
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        <Link href={`/blog/${relatedPost.slug}`}>
                          <Image
                            src={relatedPost.image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </Link>
                        <div className="absolute top-4 left-4 z-10">
                          <span className="bg-background/95 backdrop-blur-md text-foreground text-xs font-semibold px-3 py-1.5 rounded-full border border-border/50 shadow-sm">
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
                          <h3 className="text-xl md:text-2xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2 leading-tight">
                            {relatedPost.title}
                          </h3>
                        </Link>
                        <p className="text-muted-foreground mb-6 line-clamp-3 flex-grow leading-relaxed">
                          {relatedPost.excerpt}
                        </p>
                        <Link
                          href={`/blog/${relatedPost.slug}`}
                          className="text-primary hover:underline font-semibold text-sm inline-flex items-center gap-2 group/link"
                        >
                          Read More
                          <ArrowLeft className="h-4 w-4 rotate-180 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
