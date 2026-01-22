import Link from "next/link";
import { Facebook, Twitter, Youtube, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-100">
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* About Section */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">ADORNE</h3>
            <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">
              We are a team of designers and developers that create high quality
              e-commerce experiences and provide premium support to our customers.
            </p>
            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
              <p>
                <span className="font-medium">Address:</span> Delhi, India
              </p>
              <p>
                <span className="font-medium">Phone:</span>{" "}
                <Link href="tel:+911234567890" className="hover:text-primary transition-colors">
                  +91 1234567890
                </Link>
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                <Link href="mailto:admin@adorne.com" className="hover:text-primary transition-colors break-all">
                  admin@adorne.com
                </Link>
              </p>
            </div>
            <div className="flex gap-3 sm:gap-4 mt-4">
              <Link href="#" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-primary transition-colors">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-primary transition-colors">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Customer Service</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Warranty
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Newsletter</h4>
            <p className="text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4">
              Sign up for news & special offers!
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 sm:px-4 py-2 text-sm rounded-md bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 text-sm rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
          <p className="text-center sm:text-left">© {new Date().getFullYear()} Adorne. All Rights Reserved.</p>
          <div className="flex-shrink-0">
            <img
              src="/img/payment.png"
              alt="Payment Methods"
              className="h-6 sm:h-8 opacity-60"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
