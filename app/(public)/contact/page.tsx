"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  MessageCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Message sent successfully! We'll get back to you soon.");
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setIsSubmitted(false);
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      content: "123 Jewelry Street, Connaught Place",
      subContent: "New Delhi, Delhi 110001, India",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: Phone,
      title: "Call Us",
      content: "+91 1234567890",
      subContent: "Mon - Sat: 9:00 AM - 8:00 PM",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      icon: Mail,
      title: "Email Us",
      content: "info@adorne.com",
      subContent: "We'll respond within 24 hours",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      icon: Clock,
      title: "Business Hours",
      content: "Monday - Saturday",
      subContent: "9:00 AM - 8:00 PM IST",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Get In Touch
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            We'd love to hear from you. Whether you have a question about our products, 
            need assistance, or just want to say hello, we're here to help.
          </p>
        </div>
      </motion.div>

      {/* Contact Information Cards */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-2 hover:border-primary/20">
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center",
                        info.bgColor
                      )}>
                        <Icon className={cn("h-6 w-6 sm:h-8 sm:w-8", info.color)} />
                      </div>
                      <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">{info.title}</h3>
                      <p className="text-xs sm:text-sm font-medium mb-1">{info.content}</p>
                      <p className="text-xs text-muted-foreground">{info.subContent}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 max-w-7xl mx-auto">
            {/* Left Side - Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <Card className="shadow-lg border-2">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">Send us a Message</CardTitle>
                      <CardDescription className="mt-1 text-xs sm:text-sm">
                        Fill out the form below and we'll get back to you as soon as possible.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 mx-auto mb-4 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                      <p className="text-muted-foreground">
                        Thank you for contacting us. We'll get back to you within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-semibold">
                            Full Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="John Doe"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-semibold">
                            Email Address <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="john@example.com"
                            className="h-11"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-semibold">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+91 1234567890"
                            className="h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-sm font-semibold">
                            Subject <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            placeholder="How can we help?"
                            className="h-11"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-semibold">
                          Message <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          placeholder="Tell us more about your inquiry..."
                          className="resize-none"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold" 
                        size="lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Right Side - Additional Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-6"
            >
              <Card className="shadow-lg border-2">
                <CardHeader>
                  <CardTitle className="text-xl">Why Contact Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Product Inquiries</h4>
                      <p className="text-sm text-muted-foreground">
                        Questions about our jewelry collections, customization options, or special orders.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Customer Support</h4>
                      <p className="text-sm text-muted-foreground">
                        Need help with your order, returns, exchanges, or have a complaint?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Business Partnerships</h4>
                      <p className="text-sm text-muted-foreground">
                        Interested in wholesale, collaborations, or becoming a retailer?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">General Feedback</h4>
                      <p className="text-sm text-muted-foreground">
                        Share your thoughts, suggestions, or experiences with us.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-2 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-3">Quick Response Guarantee</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We understand your time is valuable. Our team is committed to responding 
                    to all inquiries within 24 hours during business days.
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">Response Time: Within 24 hours</span>
                  </div>
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <Card className="shadow-lg border-2 overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Find Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="w-full h-64 bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Map integration available</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        123 Jewelry Street, Connaught Place, New Delhi
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
