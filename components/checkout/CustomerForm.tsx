"use client";

import {
  User,
  Phone,
  MapPin,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface Props {
  name: string;
  phone: string;
  address: string;

  setName: (value: string) => void;
  setPhone: (value: string) => void;
  setAddress: (value: string) => void;

  phoneValid: boolean;
  nameValid: boolean;
  addressValid: boolean;

  loadingLocation: boolean;
  location: string;

  getCurrentLocation: () => void;
}

export default function CustomerForm({
  name,
  phone,
  address,

  setName,
  setPhone,
  setAddress,

  phoneValid,
  nameValid,
  addressValid,

  loadingLocation,
  location,

  getCurrentLocation,
}: Props) {

  return (

    <div className="relative">

      {/* Background Glow */}

      <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#E63946]/10 rounded-full blur-[120px]" />

      <div className="relative bg-[#161616] rounded-[36px] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.5)] overflow-hidden">

        {/* Header */}

        <div className="px-10 py-10 border-b border-white/10">

          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-[#E63946] hover:translate-x-1 transition-all mb-8"
          >
            <ArrowLeft size={20} />
            Back to Cart
          </button>

          <h1 className="text-5xl font-bold text-white">
            Customer Details
          </h1>

          <p className="text-white/50 text-lg mt-4 max-w-xl">
            Please fill in your details carefully to ensure
            a fast and accurate delivery experience.
          </p>

        </div>

        {/* Form */}

        <div className="p-10">

          {/* Full Name */}

          <div className="mb-8">

            <label className="text-white font-semibold block mb-3">
              Full Name
            </label>

            <div className="relative">

              <User
                className="absolute left-6 top-1/2 -translate-y-1/2 text-[#E63946]"
                size={22}
              />

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className={`w-full h-16 bg-[#222] rounded-2xl border transition-all duration-300 pl-16 pr-5 text-white outline-none ${
                  name.length === 0
                    ? "border-white/10"
                    : nameValid
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              />

            </div>

            <div className="flex justify-between mt-3">

              <span
                className={`text-sm ${
                  nameValid
                    ? "text-green-400"
                    : "text-white/40"
                }`}
              >
                {name.length === 0
                  ? "Minimum 3 characters"
                  : nameValid
                  ? "✔ Valid Name"
                  : "Name is too short"}
              </span>

              <span className="text-white/30 text-sm">
                {name.length}/40
              </span>

            </div>

          </div>

          {/* Mobile */}

          <div className="mb-8">

            <label className="text-white font-semibold block mb-3">
              Mobile Number
            </label>

            <div className="relative">

              <Phone
                className="absolute left-6 top-1/2 -translate-y-1/2 text-[#E63946]"
                size={22}
              />

              <input
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="9876543210"
                className={`w-full h-16 bg-[#222] rounded-2xl border transition-all duration-300 pl-16 pr-5 text-white outline-none ${
                  phone.length === 0
                    ? "border-white/10"
                    : phoneValid
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              />

            </div>

            <div className="flex justify-between mt-3">

              <span
                className={`text-sm ${
                  phoneValid
                    ? "text-green-400"
                    : "text-white/40"
                }`}
              >
                {phone.length === 0
                  ? "Must start with 6,7,8 or 9"
                  : phoneValid
                  ? "✔ Valid Mobile Number"
                  : "Invalid Mobile Number"}
              </span>

              <span className="text-white/30 text-sm">
                {phone.length}/10
              </span>

            </div>

          </div>
                    {/* Delivery Address */}

          <div className="mb-8">

            <label className="text-white font-semibold block mb-3">
              Delivery Address
            </label>

            <div className="relative">

              <MapPin
                className="absolute left-6 top-6 text-[#E63946]"
                size={22}
              />

              <textarea
                rows={5}
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                placeholder="House No, Street, Landmark..."
                className={`w-full bg-[#222] rounded-2xl border transition-all duration-300 pl-16 pr-5 pt-5 text-white outline-none resize-none ${
                  address.length === 0
                    ? "border-white/10"
                    : addressValid
                    ? "border-green-500"
                    : "border-red-500"
                }`}
              />

            </div>

            <div className="flex justify-between mt-3">

              <span
                className={`text-sm ${
                  addressValid
                    ? "text-green-400"
                    : "text-white/40"
                }`}
              >
                {address.length === 0
                  ? "Minimum 20 characters"
                  : addressValid
                  ? "✔ Address looks good"
                  : "Please enter complete address"}
              </span>

              <span className="text-white/30 text-sm">
                {address.length}/300
              </span>

            </div>

          </div>

          {/* Location Card */}

          <div className="bg-[#1F1F1F] rounded-3xl border border-white/10 p-6">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-xl font-bold text-white">
                  📍 Current Location
                </h3>

                <p className="text-white/50 mt-2">
                  Detect your live location for faster delivery.
                </p>

              </div>

              <button
                onClick={getCurrentLocation}
                className="bg-[#E63946] hover:bg-red-600 transition px-6 py-3 rounded-xl font-semibold text-white"
              >
                {loadingLocation
                  ? "Loading..."
                  : "Detect"}
              </button>

            </div>

            {location && (

              <div className="mt-5 flex items-center gap-3 text-green-400">

                <CheckCircle2 size={22} />

                <span>
                  Location Captured Successfully
                </span>

              </div>

            )}

          </div>

          {/* Secure Box */}

          <div className="mt-8 bg-gradient-to-r from-[#E63946]/15 to-transparent border border-[#E63946]/20 rounded-3xl p-6">

            <h3 className="text-white text-xl font-bold">
              🔒 Secure Checkout
            </h3>

            <p className="text-white/60 mt-3 leading-7">

              Your personal information is encrypted and securely protected.

              We never share your phone number or address with third parties.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

}