"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];

  addToCart: (
    item: Omit<CartItem, "quantity">
  ) => void;

  removeFromCart: (id: number) => void;

  increaseQuantity: (id: number) => void;

  decreaseQuantity: (id: number) => void;

  clearCart: () => void;

  totalItems: number;
  totalPrice: number;
}

const CartContext =
  createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "varahi-eat-fit-cart";

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  /*
   * LOAD CART FROM LOCAL STORAGE
   *
   * This runs only in the browser.
   */
  useEffect(() => {
    try {
      const savedCart =
        window.localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (savedCart) {
        const parsedCart =
          JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  /*
   * SAVE CART TO LOCAL STORAGE
   *
   * Every time cart changes, save it.
   */
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error
      );
    }
  }, [cart, isLoaded]);

  /*
   * ADD ITEM
   *
   * If item already exists:
   * quantity becomes +1.
   *
   * Otherwise:
   * item is added with quantity 1.
   */
  const addToCart = (
    item: Omit<CartItem, "quantity">
  ) => {
    setCart((previousCart) => {
      const existingItem =
        previousCart.find(
          (cartItem) =>
            cartItem.id === item.id
        );

      if (existingItem) {
        return previousCart.map(
          (cartItem) =>
            cartItem.id === item.id
              ? {
                  ...cartItem,
                  quantity:
                    cartItem.quantity + 1,
                }
              : cartItem
        );
      }

      return [
        ...previousCart,
        {
          ...item,
          quantity: 1,
        },
      ];
    });

    // Only ONE toast
    toast.success(
      `🛒 ${item.name} added to cart`
    );
  };

  /*
   * PLUS
   */
  const increaseQuantity = (
    id: number
  ) => {
    setCart((previousCart) =>
      previousCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };

  /*
   * MINUS
   *
   * When quantity reaches 0,
   * the item is removed.
   */
  const decreaseQuantity = (
    id: number
  ) => {
    setCart((previousCart) =>
      previousCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  };

  /*
   * DELETE
   */
  const removeFromCart = (
    id: number
  ) => {
    setCart((previousCart) => {
      const item =
        previousCart.find(
          (cartItem) =>
            cartItem.id === id
        );

      if (item) {
        toast.error(
          `❌ ${item.name} removed from cart`
        );
      }

      return previousCart.filter(
        (cartItem) =>
          cartItem.id !== id
      );
    });
  };

  /*
   * CLEAR CART
   */
  const clearCart = () => {
    setCart([]);

    toast.success(
      "🛍️ Cart cleared"
    );
  };

  /*
   * TOTAL ITEMS
   */
  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [cart]);

  /*
   * TOTAL PRICE
   */
  const totalPrice = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}