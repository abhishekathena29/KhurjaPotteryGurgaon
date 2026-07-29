import { createContext, useContext, useState, useEffect } from 'react'
import { cartLineId } from '../lib/commerce'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const variant = selectedVariant || (product.variants || product.variantSummary || [])
      .find((candidate) => candidate.status !== 'inactive' && Number(candidate.availableQuantity || 0) > 0)
    if (!variant) throw new Error('This product is out of stock')
    const availableQuantity = Number(variant.availableQuantity || 0)
    if (quantity > availableQuantity) throw new Error(`Only ${availableQuantity} available`)
    const productId = product.productId || product.id
    const lineId = cartLineId(productId, variant.id)
    const cartItem = {
      ...product,
      id: lineId,
      productId,
      variantId: variant.id,
      sku: variant.sku,
      selectedColor: variant.color,
      selectedSize: variant.size || '',
      availableQuantity,
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === lineId)
      if (existingItem) {
        const nextQuantity = existingItem.quantity + quantity
        if (nextQuantity > availableQuantity) return prevCart
        return prevCart.map(item =>
          item.id === lineId
            ? { ...item, ...cartItem, quantity: nextQuantity }
            : item
        )
      }
      return [...prevCart, { ...cartItem, quantity }]
    })
  }

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: Math.min(quantity, Number(item.availableQuantity || quantity)) }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + Number(item.salePricePaise ?? Math.round(item.price * 100)) * item.quantity, 0) / 100
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
