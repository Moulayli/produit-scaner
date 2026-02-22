import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./styles.css";

export default function App() {
  const [product, setProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [scannerVisible, setScannerVisible] = useState(false);

  const PRICE = 2;

  // 🔊 Bip sonore
  const playBeep = () => {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAAA"
    );
    audio.play();
  };

  // Charger panier
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Sauvegarder panier
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Scanner caméra
  useEffect(() => {
    if (!scannerVisible) return;

    const scanner = new Html5QrcodeScanner(
      "scanner",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        playBeep(); // 🔊 Bip
        handleScan(decodedText);
        scanner.clear();
        setScannerVisible(false);
      },
      () => {}
    );

    return () => scanner.clear();
  }, [scannerVisible]);

  const handleScan = async (code) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json`
      );
      const data = await response.json();

      if (data.status === 1) {
        setProduct({
          name: data.product.product_name || "Produit inconnu",
          image: data.product.image_url || null,
        });
      } else {
        setProduct({
          name: "Produit non trouvé",
          image: null,
        });
      }
    } catch {
      setProduct({
        name: "Erreur API",
        image: null,
      });
    }
  };

  const addToCart = () => {
    if (!product) return;

    const existingIndex = cart.findIndex(
      (item) => item.name === product.name
    );

    if (existingIndex !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        { ...product, quantity: 1 }
      ]);
    }

    setProduct(null);
  };

  const updateQuantity = (index, delta) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += delta;

    if (updatedCart[index].quantity <= 0) {
      updatedCart.splice(index, 1);
    }

    setCart(updatedCart);
  };

  const total = cart.reduce(
    (sum, item) => sum + item.quantity * PRICE,
    0
  );

  return (
    <div className="app">
      <h1>🛒 Mon Panier</h1>

      <button
        className="scan-button"
        onClick={() => setScannerVisible(true)}
      >
        Scanner un produit 📷
      </button>

      {scannerVisible && <div id="scanner"></div>}

      {product && (
        <div className="product-card">
          {product.image && (
            <img src={product.image} alt={product.name} />
          )}
          <h2>{product.name}</h2>
          <button onClick={addToCart}>
            Ajouter au panier (2 €)
          </button>
        </div>
      )}

      <div className="cart">
        <h2>Panier</h2>

        {cart.length === 0 && <p>Panier vide</p>}

        {cart.map((item, index) => (
          <div key={index} className="cart-item">
            {item.image && (
              <img src={item.image} alt={item.name} />
            )}

            <div className="cart-info">
              <span>{item.name}</span>

              <div className="quantity-controls">
                <button onClick={() => updateQuantity(index, -1)}>
                  ➖
                </button>

                <span>{item.quantity}</span>

                <button onClick={() => updateQuantity(index, 1)}>
                  ➕
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="total">
          Total : <strong>{total} €</strong>
        </div>
      </div>
    </div>
  );
}