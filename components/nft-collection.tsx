"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface NFTCollectionProps {
  walletAddress?: string
}

export function NFTCollection({ walletAddress }: NFTCollectionProps) {
  const [tokenCount, setTokenCount] = useState(0)

  useEffect(() => {
    // In a real app, this would fetch the actual token count from the blockchain
    // For demo purposes, we'll use a random number between 5 and 25
    if (walletAddress) {
      const mockTokenCount = Math.floor(Math.random() * 20) + 5
      setTokenCount(mockTokenCount)
    }
  }, [walletAddress])

  const getDiscountPercentage = (count: number) => {
    if (count >= 100) return 20
    if (count >= 50) return 10
    if (count >= 25) return 5
    return 0
  }

  const discount = getDiscountPercentage(tokenCount)
  const nextTier = tokenCount < 25 ? 25 : tokenCount < 50 ? 50 : tokenCount < 100 ? 100 : 100
  const progress = (tokenCount / nextTier) * 100

  return (
    <Card className="bg-purple-900/30 border-purple-800">
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <div className="relative w-8 h-8 mr-2">
            <Image src="/solbiu.png" alt="SOLbiu Token" fill className="object-contain" />
          </div>
          <h3 className="text-sm font-medium">Your SOLbiu Collection</h3>
        </div>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Tokens Collected</span>
          <span className="font-medium">{tokenCount}</span>
        </div>

        <Progress value={progress} className="h-2 mb-3" />

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Current Discount</span>
          <span className="font-medium text-yellow-400">{discount}%</span>
        </div>

        {discount < 20 && (
          <p className="text-xs text-gray-500 mt-2">
            Collect {nextTier - tokenCount} more tokens for the next discount tier!
          </p>
        )}
      </CardContent>
    </Card>
  )
}

