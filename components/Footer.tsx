'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, ArrowRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);


function CustomerReviewForm() {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "varahi_food");

    const response = await fetch(
      "https://api.cloudinary.com/v1_1/n5adao1f/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Photo upload failed.");
    }

    const data = await response.json();

    if (!data.secure_url) {
      throw new Error("No photo URL returned.");
    }

    return data.secure_url;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim() || !review.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      let image = "";

      if (photo) {
        image = await uploadPhoto(photo);
      }

      // Store the review using the existing Firebase setup.
      const { addDoc, collection, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("@/lib/firebase");

      await addDoc(collection(db, "customerReviews"), {
        name: name.trim(),
        image,
        rating,
        review: review.trim(),
        createdAt: serverTimestamp(),
      });

      setName("");
      setReview("");
      setRating(5);
      setPhoto(null);

      const input = document.getElementById(
        "customer-review-photo"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      window.alert("Thank you! Your review has been submitted.");
    } catch (error) {
      console.error("Error submitting review:", error);
      window.alert("Could not submit your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="font-playfair text-2xl font-bold text-white">
          Write a Review
        </h4>

        <p className="font-jakarta text-white/50 text-base leading-relaxed max-w-sm font-light mt-2">
          Share your experience with us.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          className="w-full bg-white/5 border border-white/10 rounded-full py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#d91f27]/50 focus:bg-white/10 transition-all font-jakarta text-sm"
        />

        <div>
          <p className="text-white/50 text-sm mb-2 font-jakarta">
            Your rating
          </p>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                aria-label={`${value} star rating`}
                className="p-1"
              >
                <Star
                  className={`w-6 h-6 ${
                    value <= rating
                      ? "fill-[#d91f27] text-[#d91f27]"
                      : "text-white/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          placeholder="Write your review..."
          value={review}
          onChange={(event) => setReview(event.target.value)}
          maxLength={500}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#d91f27]/50 focus:bg-white/10 transition-all font-jakarta text-sm resize-none"
        />

        <div>
          <label
            htmlFor="customer-review-photo"
            className="block text-white/50 text-sm mb-2 font-jakarta"
          >
            Your photo (optional)
          </label>

          <input
            id="customer-review-photo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) =>
              setPhoto(event.target.files?.[0] ?? null)
            }
            className="w-full text-white/60 text-sm font-jakarta file:mr-3 file:rounded-lg file:border-0 file:bg-[#d91f27] file:px-4 file:py-2 file:text-white file:font-semibold file:cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[#d91f27] py-3.5 text-white font-jakarta font-bold hover:bg-[#b81820] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="contact" className="relative bg-transparent pt-32 pb-10 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[1px] bg-gradient-to-r from-transparent via-[#d91f27]/30 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] sm:w-[800px] sm:h-[800px] bg-[#d91f27]/5 rounded-full blur-[150px] pointer-events-none z-0 translate-y-[-50%]" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-20">
          
          {/* Brand & Newsletter (Left - 5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-10">
            <Link href="/" className="flex flex-col gap-2 group w-fit">
              <span className="font-playfair text-4xl sm:text-5xl font-bold tracking-tight text-white group-hover:text-white/90 transition-colors">
                Varahi
              </span>
              <span className="font-jakarta text-sm uppercase tracking-[0.3em] text-[#d91f27] font-bold pl-1">
                Eat & Fit
              </span>
            </Link>
            
            <CustomerReviewForm />
            
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#d91f27] hover:bg-[#d91f27]/10 hover:border-[#d91f27]/30 transition-all duration-300 backdrop-blur-md">
                <InstagramIcon />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#d91f27] hover:bg-[#d91f27]/10 hover:border-[#d91f27]/30 transition-all duration-300 backdrop-blur-md">
                <FacebookIcon />
              </a>
              <a href="#" className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#d91f27] hover:bg-[#d91f27]/10 hover:border-[#d91f27]/30 transition-all duration-300 backdrop-blur-md">
                <TwitterIcon />
              </a>
            </div>
          </div>
          
          {/* Quick Links (Middle - 2 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-8 lg:px-8">
            <h4 className="font-playfair text-xl font-bold text-white uppercase tracking-widest text-[13px]">Explore</h4>
            <ul className="flex flex-col gap-4 font-jakarta text-white/60 text-[15px]">
              <li><Link href="#" className="hover:text-[#d91f27] transition-colors inline-block hover:translate-x-1 transform duration-300">Home</Link></li>
              <li><Link href="#menu" className="hover:text-[#d91f27] transition-colors inline-block hover:translate-x-1 transform duration-300">Our Menu</Link></li>
              <li><Link href="#about" className="hover:text-[#d91f27] transition-colors inline-block hover:translate-x-1 transform duration-300">About Us</Link></li>
              <li><Link href="#gallery" className="hover:text-[#d91f27] transition-colors inline-block hover:translate-x-1 transform duration-300">Gallery</Link></li>
              <li><Link href="#" className="hover:text-[#d91f27] transition-colors inline-block hover:translate-x-1 transform duration-300">Reservations</Link></li>
            </ul>
          </div>
          
          {/* Contact Info (Right - 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-10">
            <div className="flex flex-col gap-8">
              <h4 className="font-playfair text-xl font-bold text-white uppercase tracking-widest text-[13px]">Contact Us</h4>
              <ul className="flex flex-col gap-6 font-jakarta text-white/60 text-[15px]">
                <li className="flex gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#d91f27]/10 group-hover:border-[#d91f27]/30 transition-colors">
                    <MapPin className="w-4 h-4 text-[#d91f27]" />
                  </div>
                  <span className="mt-2 leading-relaxed font-light group-hover:text-white transition-colors">1st Floor, 18-1-25/2, Annarao Circle, Shanthi Nagar (Near SBI Bank), KT Road, Tirupati</span>
                </li>
                <li className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#d91f27]/10 group-hover:border-[#d91f27]/30 transition-colors">
                    <Phone className="w-4 h-4 text-[#d91f27]" />
                  </div>
                  <span className="font-light group-hover:text-white transition-colors">+91 9014863642</span>
                </li>
                <li className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#d91f27]/10 group-hover:border-[#d91f27]/30 transition-colors">
                    <Mail className="w-4 h-4 text-[#d91f27]" />
                  </div>
                  <span className="font-light group-hover:text-white transition-colors">eatandfitpt@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
          
        </div>
        
        {/* Elegant Divider & Opening Hours */}
        <div className="border-t border-white/10 py-12 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 bg-[#050505]/80 backdrop-blur-sm">
            <h4 className="font-playfair text-xl font-bold text-white uppercase tracking-widest text-[13px] text-center">Opening Hours</h4>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-6">
            <div className="flex flex-col items-center text-center p-6 bg-white/[0.02] border border-white/5 rounded-[20px] backdrop-blur-sm hover:bg-white/[0.04] transition-colors">
              <span className="font-playfair text-white text-lg font-bold mb-2">Morning</span>
              <span className="font-jakarta text-white/50 text-sm">5:00 AM - 10:00 AM</span>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/[0.02] border border-white/5 rounded-[20px] backdrop-blur-sm hover:bg-white/[0.04] transition-colors">
              <span className="font-playfair text-white text-lg font-bold mb-2">Afternoon</span>
              <span className="font-jakarta text-white/50 text-sm">12:00 PM - 2:00 PM</span>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white/[0.02] border border-white/5 rounded-[20px] backdrop-blur-sm hover:bg-white/[0.04] transition-colors">
              <span className="font-playfair text-white text-lg font-bold mb-2">Evening</span>
              <span className="font-jakarta text-white/50 text-sm">5:00 PM - 9:00 PM</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-jakarta text-sm text-white/40 font-light">
            © {new Date().getFullYear()} Varahi Eat & Fit. All rights reserved.
          </p>
          <div className="flex items-center gap-8 font-jakarta text-sm text-white/40 font-light">
            <Link href="#" className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#d91f27] hover:after:w-full after:transition-all after:duration-300">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#d91f27] hover:after:w-full after:transition-all after:duration-300">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-[#d91f27] hover:after:w-full after:transition-all after:duration-300">Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
