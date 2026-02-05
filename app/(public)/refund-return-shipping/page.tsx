"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Package, Truck, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function RefundReturnShippingPage() {
  const returnSections = [
    {
      icon: RefreshCw,
      title: "1. Return Eligibility",
      content: "Items can be returned within 3 days of receipt if they are unused and in their original packaging with tags intact.",
    },
    {
      icon: CheckCircle,
      title: "2. Refund Process",
      content: "Once a return is approved, refunds will be credited to the original payment method within 7–10 business days.",
    },
    {
      icon: Package,
      title: "3. Exchange Policy",
      content: "Exchanges are subject to product availability. If the desired item is out of stock, a refund will be issued. The Exchanged product will be delivered in 3–5 business days.",
    },
  ];

  const shippingSections = [
    {
      icon: Package,
      title: "1. Shipping Locations",
      content: "We currently ship to all addresses within India.",
    },
    {
      icon: AlertCircle,
      title: "2. Shipping Charges",
      content: "Shipping charges are calculated based on the delivery location and the weight/size of the items. Applicable shipping fees will be displayed at checkout.",
    },
    {
      icon: Clock,
      title: "3. Order Processing Time",
      content: "Orders are typically processed within 1–3 business days after payment confirmation. Processing time may vary during sale periods or due to unforeseen circumstances.",
    },
    {
      icon: Truck,
      title: "4. Delivery Time",
      content: "Standard Delivery: Usually takes 3–5 business days from the date of dispatch. Express Delivery (if available): Usually delivered within 2–3 business days. Delivery times may vary depending on your location and courier partner.",
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
              <RefreshCw className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Refund, Return & Shipping Policy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Learn about our return, refund, and shipping policies to ensure a smooth shopping experience.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Company Info */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg font-semibold mb-2">Adorne Luxe Jewellery</p>
            <p className="text-muted-foreground">
              Website:{" "}
              <a href="https://adorneluxejewels.com" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                https://adorneluxejewels.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Refund & Return Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Refund, Return & Shipping Policy</h2>
            <div className="h-1 w-20 bg-primary rounded-full mx-auto"></div>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            {/* Return & Refund Sections */}
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">Return & Refund Policy</h3>
              <div className="space-y-6">
                {returnSections.map((section, index) => {
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
                              <h4 className="text-xl md:text-2xl font-bold mb-3">{section.title}</h4>
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

            {/* Shipping Policy Sections */}
            <div className="pt-8 border-t-2">
              <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">Shipping Policy</h3>
              <div className="space-y-6">
                {shippingSections.map((section, index) => {
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
                              <h4 className="text-xl md:text-2xl font-bold mb-3">{section.title}</h4>
                              <p className="text-muted-foreground leading-relaxed text-base md:text-lg whitespace-pre-line">
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Help with Returns or Shipping?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              If you have any questions about our return, refund, or shipping policies, please contact us.
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

