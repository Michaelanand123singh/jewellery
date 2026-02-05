"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, Cookie, UserCheck, Database } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: "1. Information Collection",
      content: "We collect personal information such as name, address, email, and payment details to process orders and provide a personalized shopping experience.",
    },
    {
      icon: Eye,
      title: "2. Use of Information",
      content: "Your information is used to process transactions, communicate order status, and improve our services. We may also send promotional emails if you have opted in.",
    },
    {
      icon: Lock,
      title: "3. Data Protection",
      content: "We implement security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.",
    },
    {
      icon: Shield,
      title: "4. Sharing of Information",
      content: "We do not sell or rent your personal information to third parties. We may share information with trusted partners to facilitate services like payment processing and shipping.",
    },
    {
      icon: Cookie,
      title: "5. Cookies",
      content: "Our website uses cookies to enhance user experience. You can adjust your browser settings to refuse cookies, but this may affect website functionality.",
    },
    {
      icon: UserCheck,
      title: "6. Your Rights",
      content: "You have the right to access, correct, or delete your personal information.",
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
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
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

      {/* Privacy Content */}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions About Your Privacy?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              If you have any questions or concerns about our Privacy Policy, please contact us.
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

