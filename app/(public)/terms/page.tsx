"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Scale, Shield, AlertCircle } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      icon: Scale,
      title: "1. Acceptance of Terms",
      content: "By accessing or purchasing from our website you agree to abide by these Terms & Conditions.",
    },
    {
      icon: FileText,
      title: "2. Product Information",
      content: "We strive to provide accurate product descriptions and images. However, due to variations in monitor settings and lighting, actual product colors may differ slightly from what is displayed.",
    },
    {
      icon: Shield,
      title: "3. Pricing & Payment",
      content: "Prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes. We accept various payment methods, including credit/debit cards, UPI, and net banking. Payment is processed securely through trusted gateways.",
    },
    {
      icon: AlertCircle,
      title: "4. Order Confirmation",
      content: "Upon placing an order, you will receive an email confirmation. Orders are subject to availability, and we reserve the right to cancel or modify orders at our discretion.",
    },
    {
      icon: FileText,
      title: "5. Shipping & Delivery",
      content: "We offer shipping across India. Delivery times vary based on location and product availability. Shipping charges are calculated at checkout.",
    },
    {
      icon: Shield,
      title: "6. Intellectual Property",
      content: "All content on this website, including text, images, and logos, is the property of Adorne Luxe Jewellery and is protected by copyright laws.",
    },
    {
      icon: AlertCircle,
      title: "7. Limitation of Liability",
      content: "We are not liable for any indirect, incidental, or consequential damages arising from the use of our products or services.",
    },
    {
      icon: Scale,
      title: "8. Governing Law",
      content: "These Terms & Conditions are governed by the laws of India. Any disputes will be resolved in the courts of India.",
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
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Scale className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Please read these terms carefully before using our website or making a purchase.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Terms Content */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="border-2 hover:border-primary/20 transition-colors">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl md:text-2xl font-bold mb-3">{section.title}</h2>
                          <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                            {section.content}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions About Our Terms?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              If you have any questions about these Terms & Conditions, please contact us.
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p>
                <span className="font-medium">Email:</span>{" "}
                <a href="mailto:admin@adorne.com" className="text-primary hover:underline">
                  admin@adorne.com
                </a>
              </p>
              <p>
                <span className="font-medium">Website:</span>{" "}
                <a href="https://adorneluxejewels.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  https://adorneluxejewels.com
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

