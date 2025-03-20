"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Sparkles, Check } from "lucide-react"

interface NFTRewardProps {
  transactionHash: string
}

export function NFTReward({ transactionHash }: NFTRewardProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const [isClaimed, setIsClaimed] = useState(false)

  const claimNFT = async () => {
    setIsClaiming(true)

    // Simulate NFT minting delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsClaimed(true)
    setIsClaiming(false)

    toast({
      title: "NFT Claimed Successfully!",
      description: "Your SOLbiu discount token has been added to your wallet.",
    })
  }

  return (
    <Card className="bg-purple-900/50 border-purple-700 w-full mt-6">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src="/solbiu.png"
              alt="SOLbiu Token"
              fill
              className={`object-contain ${isClaimed ? "animate-pulse" : ""}`}
            />
            {!isClaimed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse opacity-70" />
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold mb-2">Claim Your SOLbiu Token!</h3>
          <p className="text-center text-gray-400 mb-4">
            Collect SOLbiu tokens for discounts on future payments.
            <br />
            <span className="text-yellow-400">100 tokens = 20% discount</span>
          </p>

          {isClaimed ? (
            <div className="flex items-center justify-center bg-green-600/20 text-green-400 py-2 px-4 rounded-md">
              <Check className="h-5 w-5 mr-2" />
              <span>Token Claimed!</span>
            </div>
          ) : (
            <Button onClick={claimNFT} disabled={isClaiming} className="bg-yellow-600 hover:bg-yellow-700 text-white">
              {isClaiming ? "Claiming..." : "Claim NFT Reward"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

