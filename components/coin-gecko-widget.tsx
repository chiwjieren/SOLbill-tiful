"use client"

import { useEffect } from "react"

export function CoinGeckoWidget() {
  useEffect(() => {
    // Load the CoinGecko script
    const script = document.createElement("script")
    script.src = "https://widgets.coingecko.com/gecko-coin-price-marquee-widget.js"
    script.async = true
    document.body.appendChild(script)

    // Clean up on unmount
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="w-full overflow-hidden bg-purple-950 border-b border-purple-800">
      <gecko-coin-price-marquee-widget
        locale="en"
        dark-mode="true"
        outlined="true"
        coin-ids="solana"
        initial-currency="usd"
      ></gecko-coin-price-marquee-widget>
    </div>
  )
}

