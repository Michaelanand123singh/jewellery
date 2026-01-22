"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Award,
  Users,
  Heart,
  Shield,
  Truck,
  CheckCircle2,
  Target,
  TrendingUp,
  Star,
  Gem,
  HandHeart
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const values = [
    {
      icon: Gem,
      title: "Premium Quality",
      description: "We source only the finest materials and craft each piece with meticulous attention to detail.",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "Your satisfaction is our priority. We go above and beyond to ensure you love your purchase.",
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-50 dark:bg-pink-950/20",
    },
    {
      icon: Shield,
      title: "Authenticity",
      description: "Every piece is certified and guaranteed authentic. We stand behind the quality of our jewelry.",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: Sparkles,
      title: "Innovation",
      description: "We blend traditional craftsmanship with modern design to create timeless yet contemporary pieces.",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  const stats = [
    { number: "50K+", label: "Happy Customers", icon: Users },
    { number: "10K+", label: "Products Sold", icon: Award },
    { number: "15+", label: "Years of Excellence", icon: TrendingUp },
    { number: "4.8", label: "Average Rating", icon: Star },
  ];

  const milestones = [
    {
      year: "2009",
      title: "The Beginning",
      description: "Adorne was founded with a vision to make premium jewelry accessible to everyone.",
    },
    {
      year: "2015",
      title: "Online Expansion",
      description: "Launched our e-commerce platform, bringing our collections to customers worldwide.",
    },
    {
      year: "2018",
      title: "Award Recognition",
      description: "Received the 'Best Jewelry Retailer' award for outstanding customer service.",
    },
    {
      year: "2024",
      title: "Innovation Leader",
      description: "Continuing to innovate with sustainable practices and cutting-edge designs.",
    },
  ];

  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      description: "On orders above ₹500",
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "100% secure transactions",
    },
    {
      icon: HandHeart,
      title: "Easy Returns",
      description: "2-day return policy",
    },
    {
      icon: Award,
      title: "Certified Quality",
      description: "Authenticity guaranteed",
    },
  ];

  return (
    <main className="flex-grow bg-background">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24"
      >
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              About Adorne
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              We are passionate about creating exquisite jewelry that celebrates life's most precious moments. 
              With over 15 years of excellence, we've been crafting timeless pieces that become cherished heirlooms.
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Statistics Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="text-center border-2 hover:border-primary/20 transition-colors">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        {stat.number}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Sparkles className="h-24 w-24 mx-auto text-primary/20 mb-4" />
                    <p className="text-muted-foreground">Company Image</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Story</h2>
                <div className="h-1 w-20 bg-primary rounded-full mb-6"></div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Founded in 2009, Adorne began as a small family business with a simple mission: to create 
                beautiful, high-quality jewelry that makes every moment special. What started as a passion 
                project has grown into a trusted name in the jewelry industry.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Today, we combine traditional craftsmanship with modern design sensibilities, offering a 
                curated collection of rings, necklaces, earrings, and bracelets that celebrate elegance, 
                sophistication, and timeless beauty.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our commitment to quality, authenticity, and customer satisfaction has earned us the trust 
                of over 50,000 happy customers worldwide. Every piece we create is a testament to our 
                dedication to excellence.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                    <CardContent className="p-6 text-center">
                      <div className={cn(
                        "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                        value.bgColor
                      )}>
                        <Icon className={cn("h-8 w-8", value.color)} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-2 hover:border-primary/20 transition-colors">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Our Mission</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    To create exceptional jewelry that celebrates life's precious moments while maintaining 
                    the highest standards of quality, craftsmanship, and customer service. We strive to make 
                    luxury accessible and meaningful for everyone.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Card className="h-full border-2 hover:border-primary/20 transition-colors">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Our Vision</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-lg">
                    To become the most trusted and beloved jewelry brand globally, known for our innovative 
                    designs, sustainable practices, and unwavering commitment to creating pieces that become 
                    cherished family heirlooms for generations to come.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Milestones Timeline */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Key milestones in our growth and evolution
            </p>
          </motion.div>
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block"></div>
              
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.6 }}
                    className={cn(
                      "relative flex items-start gap-6 md:gap-8",
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    )}
                  >
                    {/* Timeline Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <Card className={cn(
                      "flex-1 border-2 hover:border-primary/20 transition-colors",
                      index % 2 === 0 ? "md:mr-auto md:max-w-md" : "md:ml-auto md:max-w-md"
                    )}>
                      <CardContent className="p-6">
                        <div className="text-sm font-semibold text-primary mb-2">{milestone.year}</div>
                        <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Adorne?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              What sets us apart in the world of jewelry
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="h-full text-center hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Perfect Piece?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Explore our exquisite collection and discover jewelry that speaks to your style and celebrates your moments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base font-semibold px-8">
                <Link href="/shop">Shop Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-base font-semibold px-8">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

