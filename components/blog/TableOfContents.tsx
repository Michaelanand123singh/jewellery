"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Extract headings from the actual DOM after content is rendered
    const extractHeadings = () => {
      const headingElements = document.querySelectorAll(".blog-content h2, .blog-content h3");
      
      const extractedHeadings: Heading[] = Array.from(headingElements).map((el) => {
        const text = el.textContent || "";
        let id = el.id;
        
        // Generate ID if not present
        if (!id) {
          const index = Array.from(headingElements).indexOf(el);
          id = `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          el.id = id;
        }
        
        return {
          id,
          text,
          level: parseInt(el.tagName.charAt(1)),
        };
      });

      setHeadings(extractedHeadings);
    };

    // Wait for content to be rendered, then extract headings
    const timeout = setTimeout(extractHeadings, 200);
    const interval = setInterval(extractHeadings, 1000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [content]);

  useEffect(() => {
    // Update active heading on scroll
    const handleScroll = () => {
      const headingElements = headings.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
      
      if (headingElements.length === 0) return;

      let current = "";
      for (const heading of headingElements) {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          current = heading.id;
        } else {
          break;
        }
      }

      if (current) {
        setActiveId(current);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-24 hidden lg:block w-64 flex-shrink-0">
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <List className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Table of Contents</h3>
        </div>
        <nav className="space-y-1">
          {headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => scrollToHeading(heading.id)}
              className={cn(
                "block w-full text-left text-xs py-1.5 px-2 rounded transition-colors",
                "hover:bg-muted hover:text-foreground",
                heading.level === 3 && "pl-4 text-muted-foreground",
                activeId === heading.id
                  ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              {heading.text}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

