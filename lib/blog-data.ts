export interface FAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  slug: string;
  content?: string;
  author?: string;
  readTime?: string;
  tags?: string[];
  faqs?: FAQ[];
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "The Ultimate Guide to Choosing the Perfect Engagement Ring",
    excerpt: "Discover everything you need to know about selecting the perfect engagement ring that symbolizes your love and commitment.",
    image: "/img/slider/1.jpg",
    date: "January 15, 2024",
    category: "Jewelry Guide",
    slug: "ultimate-guide-engagement-ring",
    author: "Sarah Johnson",
    readTime: "8 min read",
    tags: ["Engagement", "Rings", "Guide", "Diamonds"],
    content: `
      <p>Choosing an engagement ring is one of the most significant purchases you'll make in your lifetime. It's not just a piece of jewelry—it's a symbol of your love, commitment, and the beginning of your journey together. With so many options available, finding the perfect ring can feel overwhelming. This comprehensive guide will walk you through everything you need to know to make an informed decision.</p>

      <h2>Understanding the 4 Cs</h2>
      <p>When shopping for a diamond engagement ring, understanding the 4 Cs is crucial:</p>
      <ul>
        <li><strong>Cut:</strong> The cut determines how well a diamond reflects light. A well-cut diamond will have maximum brilliance and sparkle.</li>
        <li><strong>Color:</strong> Diamonds are graded on a color scale from D (colorless) to Z (light yellow). For most people, diamonds in the G-J range offer the best value.</li>
        <li><strong>Clarity:</strong> This refers to the presence of internal or external flaws. Most diamonds have some inclusions, but they're often invisible to the naked eye.</li>
        <li><strong>Carat:</strong> The weight of the diamond. Remember, bigger isn't always better—quality matters more than size.</li>
      </ul>

      <h2>Choosing the Right Metal</h2>
      <p>The metal you choose for your engagement ring band is just as important as the stone. Popular options include:</p>
      <ul>
        <li><strong>Platinum:</strong> Durable, hypoallergenic, and naturally white. It's the most expensive option but requires minimal maintenance.</li>
        <li><strong>White Gold:</strong> A more affordable alternative to platinum with a similar appearance. Requires periodic rhodium plating.</li>
        <li><strong>Yellow Gold:</strong> Classic and timeless. Available in various karats (14k, 18k, 24k).</li>
        <li><strong>Rose Gold:</strong> Modern and romantic, with a warm pinkish hue that's become increasingly popular.</li>
      </ul>

      <h2>Ring Styles and Settings</h2>
      <p>From classic solitaires to vintage-inspired designs, the style of your engagement ring should reflect your partner's personality and preferences. Consider:</p>
      <ul>
        <li>Solitaire settings for timeless elegance</li>
        <li>Halo settings for maximum sparkle</li>
        <li>Three-stone settings symbolizing past, present, and future</li>
        <li>Vintage-inspired designs for unique character</li>
      </ul>

      <h2>Budget Considerations</h2>
      <p>While the traditional "two months' salary" rule exists, the most important thing is choosing a ring that fits your budget and makes your partner happy. Consider financing options, but always stay within your means.</p>

      <h2>Final Tips</h2>
      <p>Before making your final decision, remember to:</p>
      <ul>
        <li>Get your partner's ring size (discreetly, if it's a surprise)</li>
        <li>Consider their lifestyle and daily activities</li>
        <li>Think about whether they prefer simple or elaborate designs</li>
        <li>Ensure the ring comes with proper certification and warranty</li>
      </ul>

      <p>Choosing the perfect engagement ring is a journey, but with the right knowledge and guidance, you'll find the ring that perfectly captures your love story.</p>
    `,
    faqs: [
      {
        question: "What is the average cost of an engagement ring?",
        answer: "The average cost varies widely, but many couples spend between ₹50,000 to ₹5,00,000. However, the most important factor is choosing a ring that fits your budget and represents your commitment. Quality and meaning matter more than price."
      },
      {
        question: "How do I determine my partner's ring size?",
        answer: "You can discreetly borrow one of their existing rings and have it measured at a jeweler, or ask a close friend or family member for help. If you're unsure, it's better to size up slightly as rings can be resized down more easily than up."
      },
      {
        question: "What's the difference between 14k, 18k, and 24k gold?",
        answer: "The 'k' stands for karat, which indicates the purity of gold. 24k is pure gold (100%), 18k is 75% gold, and 14k is 58.3% gold. Higher karat means purer gold but also softer metal. 14k and 18k are most popular for engagement rings as they're more durable."
      },
      {
        question: "Should I choose a diamond or another gemstone?",
        answer: "Both are excellent choices! Diamonds are traditional and durable, while colored gemstones like sapphires, emeralds, or rubies offer unique beauty and personalization. Consider your partner's style and preferences when making this decision."
      },
      {
        question: "What is a GIA certificate and why is it important?",
        answer: "GIA (Gemological Institute of America) certification provides an independent assessment of a diamond's quality (the 4 Cs). It ensures you're getting what you paid for and helps with insurance and resale value. Always request certification for diamonds over 0.5 carats."
      }
    ],
  },
  {
    id: 2,
    title: "Caring for Your Gold Jewelry: Tips and Tricks",
    excerpt: "Learn how to maintain the shine and beauty of your gold jewelry with these expert care tips and maintenance guidelines.",
    image: "/img/slider/2.jpg",
    date: "January 10, 2024",
    category: "Care Tips",
    slug: "caring-for-gold-jewelry",
    author: "Michael Chen",
    readTime: "6 min read",
    tags: ["Gold", "Care", "Maintenance", "Tips"],
    content: `
      <p>Gold jewelry is a timeless investment that, with proper care, can last for generations. Whether you own 14k, 18k, or 24k gold pieces, understanding how to maintain them will keep them looking beautiful for years to come.</p>

      <h2>Daily Care Practices</h2>
      <p>Prevention is the best maintenance strategy. Here are daily habits to protect your gold jewelry:</p>
      <ul>
        <li><strong>Put jewelry on last:</strong> Apply perfumes, lotions, and hairspray before putting on your jewelry to avoid chemical contact.</li>
        <li><strong>Remove before activities:</strong> Take off your jewelry before swimming, exercising, or doing household chores.</li>
        <li><strong>Store properly:</strong> Keep each piece in a separate soft pouch or compartment to prevent scratches.</li>
        <li><strong>Avoid harsh chemicals:</strong> Remove jewelry before using cleaning products or entering hot tubs with chlorine.</li>
      </ul>

      <h2>Cleaning Your Gold Jewelry</h2>
      <p>Regular cleaning keeps your gold jewelry sparkling. Here's how to do it safely:</p>
      
      <h3>Simple Soap and Water Method</h3>
      <ol>
        <li>Mix a few drops of mild dish soap with warm water</li>
        <li>Soak your jewelry for 15-20 minutes</li>
        <li>Gently scrub with a soft-bristled toothbrush</li>
        <li>Rinse thoroughly with clean water</li>
        <li>Pat dry with a soft, lint-free cloth</li>
      </ol>

      <h3>Professional Cleaning</h3>
      <p>For heavily tarnished or intricate pieces, professional cleaning every 6-12 months is recommended. Jewelers use ultrasonic cleaners and specialized solutions that safely remove deep-set dirt and tarnish.</p>

      <h2>Understanding Tarnish</h2>
      <p>Pure gold (24k) doesn't tarnish, but most jewelry is made from gold alloys (14k, 18k) which can develop a tarnished appearance over time. This is normal and easily reversible with proper cleaning.</p>

      <h2>Storage Solutions</h2>
      <p>Proper storage is crucial for maintaining your gold jewelry:</p>
      <ul>
        <li>Use jewelry boxes with soft, fabric-lined compartments</li>
        <li>Keep pieces separated to prevent scratching</li>
        <li>Store in a cool, dry place away from sunlight</li>
        <li>Consider anti-tarnish strips for long-term storage</li>
      </ul>

      <h2>When to Seek Professional Help</h2>
      <p>Consult a professional jeweler if you notice:</p>
      <ul>
        <li>Loose stones or settings</li>
        <li>Significant scratches or damage</li>
        <li>Discoloration that won't clean off</li>
        <li>Structural issues with clasps or prongs</li>
      </ul>

      <p>With these care tips, your gold jewelry will maintain its beauty and value for years to come. Remember, a little regular maintenance goes a long way in preserving your precious pieces.</p>
    `,
  },
  {
    id: 3,
    title: "Trending Jewelry Styles for 2024",
    excerpt: "Explore the latest jewelry trends and styles that are making waves in 2024, from minimalist designs to statement pieces.",
    image: "/img/slider/3.jpg",
    date: "January 5, 2024",
    category: "Trends",
    slug: "trending-jewelry-styles-2024",
    author: "Emma Williams",
    readTime: "7 min read",
    tags: ["Trends", "2024", "Fashion", "Style"],
    content: `
      <p>2024 brings exciting new directions in jewelry design, blending timeless elegance with contemporary innovation. From minimalist sophistication to bold statement pieces, this year's trends offer something for every style preference.</p>

      <h2>Minimalist Elegance</h2>
      <p>Less is more continues to dominate jewelry trends in 2024. Delicate chains, simple studs, and understated pieces that speak volumes through their refined simplicity are everywhere. Think:</p>
      <ul>
        <li>Thin, layered necklaces</li>
        <li>Small, meaningful charms</li>
        <li>Geometric shapes in subtle designs</li>
        <li>Single-stone rings with clean lines</li>
      </ul>

      <h2>Statement Earrings</h2>
      <p>While minimalism reigns in some areas, statement earrings are making a bold comeback. This year, oversized hoops, chandelier designs, and architectural shapes are taking center stage. The key is choosing one statement piece and keeping the rest of your jewelry simple.</p>

      <h2>Sustainable and Ethical Choices</h2>
      <p>Consumers are increasingly conscious of the origins of their jewelry. Lab-grown diamonds, recycled metals, and ethically sourced gemstones are more popular than ever. This trend reflects a growing awareness of environmental and social responsibility in the jewelry industry.</p>

      <h2>Vintage Revival</h2>
      <p>Vintage-inspired designs continue to captivate jewelry lovers. Art Deco geometric patterns, Victorian filigree work, and retro motifs are being reimagined for modern wearers. These pieces offer unique character and timeless appeal.</p>

      <h2>Mixed Metals</h2>
      <p>The rule of matching metals is officially outdated. Mixing gold, silver, and rose gold creates visual interest and allows for more versatile styling. Layered necklaces in different metals and multi-tone rings are particularly popular.</p>

      <h2>Personalized Pieces</h2>
      <p>Customization is key in 2024. Engraved jewelry, birthstone pieces, and personalized charms allow wearers to express their individuality. These meaningful pieces often become treasured heirlooms.</p>

      <h2>Colorful Gemstones</h2>
      <p>While diamonds remain classic, colored gemstones are having a moment. Sapphires, emeralds, rubies, and even less traditional stones like morganite and tanzanite are being featured in contemporary designs.</p>

      <h2>Chunky Chains</h2>
      <p>Bold, chunky chain necklaces and bracelets are trending for those who want to make a statement. These pieces work well on their own or layered with more delicate chains for a modern, edgy look.</p>

      <h2>Pearl Renaissance</h2>
      <p>Pearls are shedding their traditional image and appearing in modern, unexpected designs. Baroque pearls, pearl chokers, and pearl-adorned statement pieces are bringing this classic gem into the 21st century.</p>

      <h2>How to Incorporate Trends</h2>
      <p>When adopting new trends, remember:</p>
      <ul>
        <li>Choose pieces that reflect your personal style</li>
        <li>Invest in quality pieces that will last beyond the trend</li>
        <li>Mix trendy items with timeless classics</li>
        <li>Don't feel pressured to follow every trend—select what resonates with you</li>
      </ul>

      <p>Whether you're drawn to minimalist elegance or bold statements, 2024's jewelry trends offer endless possibilities for self-expression. The best jewelry is what makes you feel confident and beautiful.</p>
    `,
  },
  {
    id: 4,
    title: "Understanding Diamond Certification: What You Need to Know",
    excerpt: "Learn about diamond certification, grading reports, and why they matter when purchasing fine jewelry.",
    image: "/img/slider/4.jpg",
    date: "December 28, 2023",
    category: "Jewelry Guide",
    slug: "understanding-diamond-certification",
    author: "David Martinez",
    readTime: "5 min read",
    tags: ["Diamonds", "Certification", "Guide"],
    content: `
      <p>When purchasing a diamond, certification is one of the most important factors to consider. A diamond certificate provides an independent assessment of a diamond's quality and characteristics, giving you confidence in your purchase.</p>

      <h2>What is a Diamond Certificate?</h2>
      <p>A diamond certificate, also known as a grading report, is a document issued by an independent gemological laboratory that details a diamond's characteristics. It includes information about the 4 Cs (cut, color, clarity, carat) as well as other important factors.</p>

      <h2>Major Certification Labs</h2>
      <p>The most respected diamond certification laboratories include:</p>
      <ul>
        <li><strong>GIA (Gemological Institute of America):</strong> The most widely recognized and trusted certification authority</li>
        <li><strong>AGS (American Gem Society):</strong> Known for strict grading standards</li>
        <li><strong>IGI (International Gemological Institute):</strong> Popular for lab-grown diamonds</li>
        <li><strong>HRD (Hoge Raad voor Diamant):</strong> European certification standard</li>
      </ul>

      <h2>What to Look For</h2>
      <p>Always verify that your diamond comes with a certificate from a reputable lab, and ensure the certificate matches the diamond you're purchasing.</p>
    `,
  },
  {
    id: 5,
    title: "The Art of Layering Necklaces: A Style Guide",
    excerpt: "Master the art of necklace layering with our comprehensive guide to creating stunning, personalized looks.",
    image: "/img/slider/5.jpg",
    date: "December 20, 2023",
    category: "Style Guide",
    slug: "art-of-layering-necklaces",
    author: "Olivia Brown",
    readTime: "6 min read",
    tags: ["Necklaces", "Styling", "Fashion"],
    content: `
      <p>Layering necklaces is an art form that allows you to create unique, personalized looks. When done correctly, it adds depth, interest, and sophistication to any outfit.</p>

      <h2>Basic Principles</h2>
      <p>Start with varying lengths, mix different textures, and choose complementary styles. The key is balance and harmony.</p>
    `,
  },
  {
    id: 6,
    title: "Silver vs. Gold: Which Metal is Right for You?",
    excerpt: "Compare silver and gold jewelry to help you decide which metal best suits your style and budget.",
    image: "/img/slider/6.jpg",
    date: "December 15, 2023",
    category: "Jewelry Guide",
    slug: "silver-vs-gold-comparison",
    author: "James Anderson",
    readTime: "4 min read",
    tags: ["Silver", "Gold", "Comparison"],
    content: `
      <p>Choosing between silver and gold jewelry depends on your personal style, skin tone, budget, and lifestyle. Both metals have their unique advantages.</p>

      <h2>Consider Your Style</h2>
      <p>Gold offers warmth and luxury, while silver provides a cool, modern aesthetic. Consider which complements your wardrobe and personal style better.</p>
    `,
  },
];

// API-based functions (preferred)
export async function getBlogPostBySlugFromAPI(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/blogs/slug/${slug}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.success && data.data) {
      return transformBlogToBlogPost(data.data);
    }
    return null;
  } catch (error) {
    console.error('Error fetching blog from API:', error);
    return null;
  }
}

export async function getAllBlogPostsFromAPI(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/v1/blogs?published=true&limit=100`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const data = await response.json();
    if (data.success && data.data) {
      return data.data.map(transformBlogToBlogPost);
    }
    return [];
  } catch (error) {
    console.error('Error fetching blogs from API:', error);
    return [];
  }
}

// Transform database Blog to frontend BlogPost format
function transformBlogToBlogPost(blog: any): BlogPost {
  // Convert string ID to number for compatibility (use hash if needed)
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
}

// Legacy static functions (fallback)
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return blogPosts;
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}

