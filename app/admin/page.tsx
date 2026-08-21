"use client";
import { useEffect, useState } from "react";
import {
  getMenu,
  addFood,
  updateFood,
  deleteFood,
} from "@/lib/menuService";

import { MenuItem } from "@/types/menu";
import { Offer } from "@/types/offer";
import {
  getOffers,
  addOffer,
  updateOffer,
  deleteOffer,
} from "@/lib/offerService";
type AdminMenuItem = MenuItem & {
  available?: boolean;
};

import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// Firebase Storage is not used for food images.


export default function AdminPage() {
  const router = useRouter();

  const [foods, setFoods] = useState<AdminMenuItem[]>([]);

  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [imageUploading, setImageUploading] =
    useState(false);

  const [reviews, setReviews] = useState<
    {
      id: string;
      name: string;
      image: string;
      rating: number;
      review: string;
    }[]
  >([]);

  const [reviewsLoading, setReviewsLoading] =
    useState(true);

  const [deletingReviewId, setDeletingReviewId] =
  useState<string | null>(null);
  const [offers, setOffers] =
  useState<Offer[]>([]);

const [offersLoading, setOffersLoading] =
  useState(true);

const [editingOfferId, setEditingOfferId] =
  useState<string | null>(null);

const [offerForm, setOfferForm] = useState({
  title: "",
  subtitle: "",
  description: "",
  code: "",
  buttonText: "ORDER NOW",
  image: "",
  active: true,
});

  const [offerImageFile, setOfferImageFile] =
    useState<File | null>(null);

  const [offerImageUploading, setOfferImageUploading] =
    useState(false);


  const [form, setForm] = useState<AdminMenuItem>({
  name: "",
  description: "",
  category: "Salads",
  price: 0,
  image: "",
  rating: 4.8,
  calories: 0,
  protein: "",
  isVegetarian: true,
  available: true,
});

  async function loadFoods() {
    const data = await getMenu();

    console.log("Firestore Menu:", data);

    setFoods(data);
  }

  async function loadReviews() {
    try {
      setReviewsLoading(true);

      const snapshot = await getDocs(
        collection(db, "customerReviews")
      );

      const data = snapshot.docs.map((reviewDoc) => {
        const reviewData = reviewDoc.data();

        return {
          id: reviewDoc.id,
          name: String(
            reviewData.name ?? "Customer"
          ),
          image: String(
            reviewData.image ?? ""
          ),
          rating: Number(
            reviewData.rating ?? 5
          ),
          review: String(
            reviewData.review ?? ""
          ),
        };
      });

      setReviews(data);
    } catch (error) {
      console.error(
        "Error loading customer reviews:",
        error
      );
    } finally {
      setReviewsLoading(false);
    }
  }

  async function loadOffers() {
    try {
      setOffersLoading(true);
      const data = await getOffers();
      setOffers(data);
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setOffersLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
    loadReviews();
    loadOffers();
  }, []);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.replace("/login");
        } else {
          setCheckingAuth(false);
        }
      });

    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F10] text-white">
        Checking Login...
      </div>
    );
  }

  /* =========================================
     UPLOAD IMAGE TO CLOUDINARY
     ========================================= */

  async function uploadImage(
    file: File
  ): Promise<string> {
    const cloudName = "n5adao1f";
    const uploadPreset = "varahi_food";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Cloudinary upload failed: ${errorText}`
      );
    }

    const data = await response.json();

    if (!data.secure_url) {
      throw new Error(
        "Cloudinary did not return an image URL."
      );
    }

    return data.secure_url;
  }

  /* =========================================
     SUBMIT FOOD
  ========================================= */

  async function handleSubmit() {
    try {
      setLoading(true);

      let imageUrl = form.image;

      /* ---------------------------------------
         Upload selected image if available
      --------------------------------------- */

      if (imageFile) {
        setImageUploading(true);

        imageUrl = await uploadImage(imageFile);

        setImageUploading(false);
      }

      /* ---------------------------------------
         Require an image
      --------------------------------------- */

      if (!imageUrl.trim()) {
        alert(
          "Please upload an image or enter an online image URL."
        );

        setLoading(false);
        return;
      }

      const foodData: MenuItem = {
        ...form,
        image: imageUrl,
      };

      /* ---------------------------------------
         EDIT
      --------------------------------------- */

      if (editingId) {
        await updateFood(
          editingId,
          foodData
        );
      }

      /* ---------------------------------------
         ADD
      --------------------------------------- */

      else {
        await addFood(foodData);
      }

      /* ---------------------------------------
         Refresh list
      --------------------------------------- */

      await loadFoods();

      /* ---------------------------------------
         Reset form
      --------------------------------------- */

      setEditingId(null);

      setImageFile(null);

      setForm({
  name: "",
  description: "",
  category: "Salads",
  price: 0,
  image: "",
  rating: 4.8,
  calories: 0,
  protein: "",
  isVegetarian: true,
  available: true,
});

    } catch (error) {
      console.error(
        "Error saving food:",
        error
      );

      alert(
        "Failed to save food item. Please try again."
      );
    } finally {
      setImageUploading(false);
      setLoading(false);
    }
  }
  async function toggleAvailability(food: AdminMenuItem) {
  if (!food.id) return;

  try {
    const newAvailability = food.available === false;

    await updateFood(food.id, {
      available: newAvailability,
    });

    setFoods((previousFoods) =>
      previousFoods.map((item) =>
        item.id === food.id
          ? {
              ...item,
              available: newAvailability,
            }
          : item
      )
    );
  } catch (error) {
    console.error(
      "Error updating food availability:",
      error
    );

    alert(
      "Failed to update food availability. Please try again."
    );
  }
}
  /* =========================================
     DELETE
  ========================================= */

  async function handleDelete(id: string) {
    if (!confirm("Delete this food item?"))
      return;

    await deleteFood(id);

    await loadFoods();
  }

  /* =========================================
     DELETE CUSTOMER REVIEW
  ========================================= */

  /* =========================================
     OFFERS
     ========================================= */

  async function handleOfferSubmit() {
    try {
      if (!offerForm.title.trim()) {
        alert("Please enter an offer title.");
        return;
      }

      let offerImageUrl = offerForm.image;

      if (offerImageFile) {
        setOfferImageUploading(true);
        offerImageUrl = await uploadImage(offerImageFile);
      }

      if (!offerImageUrl.trim()) {
        alert("Please upload an image or enter an online image URL.");
        return;
      }

      const offerData = {
        title: offerForm.title.trim(),
        subtitle: offerForm.subtitle.trim(),
        description: offerForm.description.trim(),
        code: offerForm.code.trim(),
        buttonText:
          offerForm.buttonText.trim() || "ORDER NOW",
        image: offerImageUrl.trim(),
        active: offerForm.active,
      };

      if (editingOfferId) {
        await updateOffer(editingOfferId, offerData);
      } else {
        await addOffer(offerData);
      }

      await loadOffers();

      setEditingOfferId(null);

      setOfferForm({
        title: "",
        subtitle: "",
        description: "",
        code: "",
        buttonText: "ORDER NOW",
        image: "",
        active: true,
      });
      setOfferImageFile(null);
    } catch (error) {
      console.error("Error saving offer:", error);
      alert("Failed to save offer. Please try again.");
    } finally {
      setOfferImageUploading(false);
    }
  }

  function handleEditOffer(offer: Offer) {
    if (!offer.id) return;

    setEditingOfferId(offer.id);
    setOfferImageFile(null);

    setOfferForm({
      title: offer.title ?? "",
      subtitle: offer.subtitle ?? "",
      description: offer.description ?? "",
      code: offer.code ?? "",
      buttonText: offer.buttonText ?? "ORDER NOW",
      image: offer.image ?? "",
      active: offer.active !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDeleteOffer(id: string) {
    if (!confirm("Delete this offer?")) return;

    try {
      await deleteOffer(id);
      await loadOffers();

      if (editingOfferId === id) {
        setEditingOfferId(null);
        setOfferForm({
          title: "",
          subtitle: "",
          description: "",
          code: "",
          buttonText: "ORDER NOW",
          image: "",
          active: true,
        });
        setOfferImageFile(null);
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      alert("Failed to delete the offer. Please try again.");
    }
  }

  async function toggleOffer(offer: Offer) {
    if (!offer.id) return;

    try {
      const newActive = offer.active === false;

      if (newActive) {
        await Promise.all(
          offers
            .filter(
              (item) =>
                item.id &&
                item.id !== offer.id &&
                item.active === true
            )
            .map((item) =>
              updateOffer(item.id!, {
                active: false,
              })
            )
        );
      }

      await updateOffer(offer.id, {
        active: newActive,
      });

      await loadOffers();
    } catch (error) {
      console.error("Error updating offer status:", error);
      alert("Failed to update offer status. Please try again.");
    }
  }

  async function handleDeleteReview(
    id: string
  ) {
    if (
      !confirm(
        "Delete this customer review? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeletingReviewId(id);

      await deleteDoc(
        doc(db, "customerReviews", id)
      );

      setReviews((previous) =>
        previous.filter(
          (review) => review.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Error deleting customer review:",
        error
      );

      alert(
        "Failed to delete the review. Please try again."
      );
    } finally {
      setDeletingReviewId(null);
    }
  }

  /* =========================================
     EDIT
  ========================================= */

  function handleEdit(food: AdminMenuItem) {
    if (!food.id) return;

    setEditingId(food.id);

    setImageFile(null);

   setForm({
  name: food.name,
  description: food.description,
  category: food.category,
  price: food.price,
  image: food.image,
  rating: food.rating,
  calories: food.calories,
  protein: food.protein,
  isVegetarian:
    food.isVegetarian ?? true,
  available:
    food.available !== false,
});

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen bg-[#0F0F10] text-white p-10">

      <div className="max-w-7xl mx-auto">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="flex justify-between items-center mb-10">

          <h1 className="text-5xl font-bold">
            Restaurant Dashboard
          </h1>

          <button
            onClick={async () => {
              await signOut(auth);
              router.replace("/login");
            }}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-semibold"
          >
            Logout
          </button>

        </div>

        <div className="grid lg:grid-cols-2 gap-10">

          {/* =====================================
              ADD FOOD
          ===================================== */}

          <div className="bg-[#171717] rounded-3xl p-8">

            <h2 className="text-3xl font-bold mb-8">
              {editingId
                ? "Edit Food"
                : "Add Food"}
            </h2>

            <div className="space-y-5">

              {/* FOOD NAME */}

              <input
                type="text"
                placeholder="Food Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                className="w-full bg-[#252525] rounded-xl p-4 outline-none"
              />

              {/* DESCRIPTION */}

              <textarea
                rows={4}
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value,
                  })
                }
                className="w-full bg-[#252525] rounded-xl p-4 outline-none"
              />

              {/* CATEGORY */}

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category:
                      e.target.value,
                  })
                }
                className="w-full bg-[#252525] rounded-xl p-4 outline-none"
              >
                <option value="Salads">Salads</option>
<option value="Protein Shakes">Protein Shakes</option>
<option value="Soups">Soups</option>
<option value="Rolls">Rolls</option>
<option value="Eggs">Eggs</option>
<option value="Fruit Juices">Fruit Juices</option>
<option value="Veg Juices">Veg Juices</option>
<option value="Leafy Juices">Leafy Juices</option>
<option value="Tea">Tea</option>
              </select>

              {/* PRICE */}

              <input
                type="number"
                min="0"
                placeholder="Price (₹)"
                value={
                  form.price === 0
                    ? ""
                    : form.price
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    price:
                      Number(
                        e.target.value
                      ) || 0,
                  })
                }
                className="w-full bg-[#252525] rounded-xl p-4 outline-none"
              />

              {/* CALORIES */}

              <input
                type="number"
                min="0"
                placeholder="Calories (kcal)"
                value={
                  form.calories === 0
                    ? ""
                    : form.calories
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    calories:
                      Number(
                        e.target.value
                      ) || 0,
                  })
                }
                className="w-full bg-[#252525] rounded-xl p-4 outline-none"
              />

              {/* PROTEIN */}

              <input
                type="text"
                placeholder="Protein (g)"
                value={form.protein}
                onChange={(e) =>
                  setForm({
                    ...form,
                    protein:
                      e.target.value,
                  })
                }
                className="w-full bg-[#252525] rounded-xl p-4 outline-none"
              />

              {/* =================================
                  DEVICE IMAGE UPLOAD
              ================================= */}

              <div className="bg-[#252525] rounded-xl p-5">

                <label className="block text-white font-semibold mb-3">
                  Food Image
                </label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file =
                      e.target.files?.[0] ||
                      null;

                    setImageFile(file);
                  }}
                  className="w-full text-white/70 text-sm
                  file:mr-4
                  file:rounded-lg
                  file:border-0
                  file:bg-[#E63946]
                  file:px-4
                  file:py-2
                  file:text-white
                  file:font-semibold
                  file:cursor-pointer"
                />

                {imageFile && (
                  <p className="text-green-400 text-sm mt-3">
                    Selected:{" "}
                    {imageFile.name}
                  </p>
                )}

              </div>

              {/* =================================
                  OR ONLINE IMAGE URL
              ================================= */}

              <div>

                <p className="text-white/50 text-sm mb-2">
                  Or use an online image
                </p>

                <input
                  type="url"
                  placeholder="Online Image URL (https://...)"
                  value={form.image}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      image:
                        e.target.value,
                    });

                    // If online URL is entered,
                    // remove selected file so URL
                    // becomes the image source.
                    setImageFile(null);
                  }}
                  className="w-full bg-[#252525] rounded-xl p-4 outline-none"
                />

              </div>

              {/* =================================
                  IMAGE PREVIEW
              ================================= */}

              {(form.image ||
                imageFile) && (
                <div className="bg-[#252525] rounded-xl p-4">

                  <p className="text-white/50 text-sm mb-3">
                    Image Preview
                  </p>

                  {imageFile ? (
                    <img
                      src={URL.createObjectURL(
                        imageFile
                      )}
                      alt="Selected food"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : form.image ? (
                    <img
                      src={form.image}
                      alt="Food preview"
                      className="w-full h-48 object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : null}

                </div>
              )}

              {/* =================================
                  ADD / SAVE
              ================================= */}

              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  imageUploading
                }
                className="w-full bg-[#E63946] hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl py-4 font-bold text-lg"
              >
                {imageUploading
                  ? "Uploading Image..."
                  : loading
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Add Food"}
              </button>

            </div>

          </div>

          {/* =====================================
              FOOD ITEMS
          ===================================== */}

          <div className="bg-[#171717] rounded-3xl p-8">

            <h2 className="text-3xl font-bold mb-8">
              Food Items
            </h2>

            <div className="space-y-5">

              {foods.length === 0 ? (

                <p className="text-white/50">
                  No food items found.
                </p>

              ) : (

                foods.map((food) => (

                  <div
                    key={food.id}
                    className="flex items-center justify-between bg-[#252525] rounded-2xl p-5"
                  >

                    <div className="flex gap-4 items-center">

                      <img
                        src={food.image}
                        alt={food.name}
                        className="w-24 h-24 rounded-xl object-cover"
                      />

                      <div>

                        <h3 className="text-2xl font-bold">
                          {food.name}
                        </h3>

                        <p className="text-white/50 mt-1">
                          {food.description}
                        </p>

                        <p className="text-[#E63946] font-bold mt-2">
                          ₹{food.price}
                        </p>

                        <p className="text-white/40">
                          {food.category}
                        </p>

                        <p className="text-white/40 text-sm mt-1">
                          ⭐ {food.rating}
                        </p>

                      </div>

                    </div>

                    <div className="flex gap-3">

  {/* Availability */}
  <button
    type="button"
    onClick={() => toggleAvailability(food)}
    className={`px-5 py-3 rounded-xl font-semibold transition ${
  food.available === false
    ? "bg-red-600 hover:bg-red-700"
    : "bg-green-600 hover:bg-green-700"
}`}
  >
    {food.available === false
      ? "Make Available"
      : "Make Unavailable"}
  </button>

  {/* Edit */}
  <button
    onClick={() =>
      handleEdit(food)
    }
    className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
  >
    Edit
  </button>

  {/* Delete */}
  <button
    onClick={() => {
      if (!food.id)
        return;

      handleDelete(food.id);
    }}
    className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-semibold"
  >
    Delete
  </button>

</div>

                  </div>

                ))

              )}

            </div>

          </div>

          {/* =====================================
              OFFERS
              ===================================== */}
          <div className="bg-[#171717] rounded-3xl p-8 lg:col-span-2">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold">
                  Website Offers
                </h2>
                <p className="text-white/50 mt-2">
                  Create and manage the promotional banner shown on the homepage.
                </p>
              </div>

              <div className="bg-[#252525] px-4 py-2 rounded-xl text-white/70 text-sm">
                {offers.length} offer{offers.length === 1 ? "" : "s"}
              </div>
            </div>

            <div className="bg-[#252525] rounded-2xl p-6 mb-8">
              <h3 className="text-2xl font-bold mb-6">
                {editingOfferId ? "Edit Offer" : "Add Offer"}
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <input
                  type="text"
                  placeholder="Offer Title (e.g. 20% OFF FIRST ORDER)"
                  value={offerForm.title}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      title: e.target.value,
                    })
                  }
                  className="w-full bg-[#171717] rounded-xl p-4 outline-none"
                />

                <input
                  type="text"
                  placeholder="Subtitle"
                  value={offerForm.subtitle}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      subtitle: e.target.value,
                    })
                  }
                  className="w-full bg-[#171717] rounded-xl p-4 outline-none"
                />

                <textarea
                  rows={3}
                  placeholder="Description"
                  value={offerForm.description}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#171717] rounded-xl p-4 outline-none"
                />

                <input
                  type="text"
                  placeholder="Coupon Code (e.g. VARAHI20)"
                  value={offerForm.code}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      code: e.target.value,
                    })
                  }
                  className="w-full bg-[#171717] rounded-xl p-4 outline-none"
                />

                <input
                  type="text"
                  placeholder="Button Text (e.g. ORDER NOW)"
                  value={offerForm.buttonText}
                  onChange={(e) =>
                    setOfferForm({
                      ...offerForm,
                      buttonText: e.target.value,
                    })
                  }
                  className="w-full bg-[#171717] rounded-xl p-4 outline-none"
                />

                <div className="bg-[#171717] rounded-xl p-4">
                  <label className="block text-white font-semibold mb-3">
                    Offer Banner Image
                  </label>

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0] || null;

                      setOfferImageFile(file);

                      if (file) {
                        setOfferForm({
                          ...offerForm,
                          image: "",
                        });
                      }
                    }}
                    className="w-full text-white/70 text-sm
                    file:mr-4
                    file:rounded-lg
                    file:border-0
                    file:bg-[#E63946]
                    file:px-4
                    file:py-2
                    file:text-white
                    file:font-semibold
                    file:cursor-pointer"
                  />

                  {offerImageFile && (
                    <p className="text-green-400 text-sm mt-3">
                      Selected: {offerImageFile.name}
                    </p>
                  )}

                  <p className="text-white/40 text-xs mt-3">
                    Choose an image from your PC, phone storage,
                    pen drive, external drive, or another connected device.
                  </p>

                  <div className="mt-4">
                    <p className="text-white/40 text-xs mb-2">
                      Or use an online image URL
                    </p>

                    <input
                      type="url"
                      placeholder="https://..."
                      value={offerForm.image}
                      onChange={(e) => {
                        setOfferForm({
                          ...offerForm,
                          image: e.target.value,
                        });
                        setOfferImageFile(null);
                      }}
                      className="w-full bg-[#252525] rounded-xl p-4 outline-none"
                    />
                  </div>
                </div>
              </div>

              {(offerForm.image || offerImageFile) && (
                <div className="mt-5">
                  <p className="text-white/50 text-sm mb-3">
                    Offer Image Preview
                  </p>

                  {offerImageFile ? (
                    <img
                      src={URL.createObjectURL(offerImageFile)}
                      alt="Selected offer"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  ) : offerForm.image ? (
                    <img
                      src={offerForm.image}
                      alt="Offer preview"
                      className="w-full h-48 object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={() =>
                    setOfferForm({
                      ...offerForm,
                      active: !offerForm.active,
                    })
                  }
                  className={`px-5 py-3 rounded-xl font-semibold transition ${
                    offerForm.active
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {offerForm.active ? "Active" : "Inactive"}
                </button>

                <button
                  type="button"
                  onClick={handleOfferSubmit}
                  disabled={offerImageUploading}
                  className="bg-[#E63946] hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold"
                >
                  {offerImageUploading
                    ? "Uploading Image..."
                    : editingOfferId
                    ? "Save Offer Changes"
                    : "Add Offer"}
                </button>

                {editingOfferId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOfferId(null);
                      setOfferForm({
                        title: "",
                        subtitle: "",
                        description: "",
                        code: "",
                        buttonText: "ORDER NOW",
                        image: "",
                        active: true,
                      });
                      setOfferImageFile(null);
                    }}
                    className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-semibold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>

            {offersLoading ? (
              <p className="text-white/50">
                Loading offers...
              </p>
            ) : offers.length === 0 ? (
              <div className="bg-[#252525] rounded-2xl p-8 text-center">
                <p className="text-white/50">
                  No offers created yet.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="bg-[#252525] rounded-2xl p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="flex gap-4 items-center min-w-0">
                        {offer.image ? (
                          <img
                            src={offer.image}
                            alt={offer.title}
                            className="w-28 h-20 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-28 h-20 rounded-xl bg-black/30 flex items-center justify-center text-white/30 shrink-0">
                            No Image
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="text-xl font-bold">
                            {offer.title}
                          </h3>

                          <p className="text-white/60 mt-1">
                            {offer.subtitle}
                          </p>

                          {offer.code && (
                            <p className="text-[#FFCC00] font-semibold mt-2">
                              Code: {offer.code}
                            </p>
                          )}

                          <p className="text-white/40 text-sm mt-1">
                            {offer.active
                              ? "Currently visible on website"
                              : "Hidden from website"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleOffer(offer)}
                          className={`px-5 py-3 rounded-xl font-semibold transition ${
                            offer.active
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {offer.active ? "Active" : "Inactive"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditOffer(offer)}
                          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!offer.id) return;
                            handleDeleteOffer(offer.id);
                          }}
                          className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* =====================================
              CUSTOMER REVIEWS
          ===================================== */}
          <div className="bg-[#171717] rounded-3xl p-8 lg:col-span-2">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold">
                  Customer Reviews
                </h2>
                <p className="text-white/50 mt-2">
                  Reviews submitted by customers from the website.
                </p>
              </div>

              <div className="bg-[#252525] px-4 py-2 rounded-xl text-white/70 text-sm">
                {reviews.length} review
                {reviews.length === 1 ? "" : "s"}
              </div>
            </div>

            {reviewsLoading ? (
              <p className="text-white/50">
                Loading reviews...
              </p>
            ) : reviews.length === 0 ? (
              <div className="bg-[#252525] rounded-2xl p-8 text-center">
                <p className="text-white/50">
                  No customer reviews yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#252525] rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {review.image ? (
                          <img
                            src={review.image}
                            alt={review.name}
                            className="w-14 h-14 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#E63946] flex items-center justify-center text-xl font-bold shrink-0">
                            {review.name
                              .trim()
                              .charAt(0)
                              .toUpperCase() || "C"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h3 className="font-bold text-lg truncate">
                            {review.name}
                          </h3>

                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={
                                  star <= review.rating
                                    ? "text-yellow-400"
                                    : "text-white/20"
                                }
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteReview(review.id)
                        }
                        disabled={
                          deletingReviewId === review.id
                        }
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-xl font-semibold shrink-0"
                      >
                        {deletingReviewId === review.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>

                    <p className="text-white/60 leading-7 mt-5">
                      "{review.review}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </main>
  );
}