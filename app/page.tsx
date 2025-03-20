"use client"

import { useState, useEffect, useRef } from "react"
import { Receipt, ArrowRight, Minus, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Html5Qrcode } from "html5-qrcode"
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { CoinGeckoWidget } from "@/components/coin-gecko-widget"
import { NFTReward } from "@/components/nft-reward"
import { NFTCollection } from "@/components/nft-collection"
import Image from "next/image"

export default function Home() {
  const { connected, publicKey, signTransaction } = useWallet()
  const [currentView, setCurrentView] = useState("home")
  const [receiptItems, setReceiptItems] = useState<any[]>([])
  const [myItems, setMyItems] = useState<any[]>([])
  const [confirmations, setConfirmations] = useState(0)
  const [totalParticipants, setTotalParticipants] = useState(1) // Changed to 1 for demo
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [qrScannerOpen, setQrScannerOpen] = useState(false)
  const [allItemsSelected, setAllItemsSelected] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [transactionHash, setTransactionHash] = useState("")
  const [transactionSuccess, setTransactionSuccess] = useState(false)
  const [pastPayments, setPastPayments] = useState([
    {
      id: 1,
      date: "March 18, 2025",
      restaurant: "Crypto Cafe",
      amount: 35.75,
      participants: 1,
      status: "completed",
      txHash: "5UxV7...3Qe9h",
      fullTxHash: "5UxV7KpDLM8HG6vJ2CwbWCsR4QvMFY3Qe9h",
    },
    {
      id: 2,
      date: "March 15, 2025",
      restaurant: "Web3 Diner",
      amount: 42.2,
      participants: 1,
      status: "completed",
      txHash: "2KpL8...7Rt3v",
      fullTxHash: "2KpL8nQxRfP9BzTw5H3mVJyDcL7Rt3v",
    },
    {
      id: 3,
      date: "March 10, 2025",
      restaurant: "Blockchain Bistro",
      amount: 67.5,
      participants: 1,
      status: "completed",
      txHash: "9JmN4...1Zx8p",
      fullTxHash: "9JmN4zXqLpS7vBtHgK2rDyWmP1Zx8p",
    },
  ])

  const qrScannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  // Check if all items are selected
  useEffect(() => {
    const totalReceiptQty = receiptItems.reduce((total, item) => total + item.qty, 0)
    setAllItemsSelected(totalReceiptQty === 0)
  }, [receiptItems])

  // Clean up QR scanner when component unmounts
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch((err) => console.error(err))
      }
    }
  }, [])

  const startSplit = () => {
    setQrScannerOpen(true)
  }

  const closeQrScanner = () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().catch((err) => console.error(err))
    }
    setQrScannerOpen(false)
  }

  const initQrScanner = () => {
    if (!qrScannerRef.current) return

    const qrCodeSuccessCallback = (decodedText: string) => {
      closeQrScanner()
      processQrCode(decodedText)
    }

    const config = { fps: 10, qrbox: { width: 250, height: 250 } }

    html5QrCodeRef.current = new Html5Qrcode("qr-reader")
    html5QrCodeRef.current
      .start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined)
      .catch((err) => {
        console.error("QR Scanner error:", err)
        toast({
          title: "Camera Error",
          description: "Could not access camera. Please check permissions.",
          variant: "destructive",
        })
      })
  }

  const processQrCode = (qrData: string) => {
    try {
      // In a real app, this would parse the QR code data
      // For demo purposes, we'll use mock data
      const mockReceiptData = [
        { id: 1, name: "GLASS STAR #148", qty: 1, price: 8.5, assigned: false },
        { id: 2, name: "NOODLES (L)", qty: 2, price: 12.5, assigned: false },
        { id: 3, name: "FRIED RICE", qty: 1, price: 9.75, assigned: false },
        { id: 4, name: "SPRING ROLLS", qty: 3, price: 4.5, assigned: false },
      ]

      setReceiptItems(mockReceiptData)
      setCurrentView("receipt")
      toast({
        title: "Receipt Scanned",
        description: "Successfully scanned receipt from restaurant",
      })
    } catch (error) {
      console.error("Error processing QR code:", error)
      toast({
        title: "Invalid QR Code",
        description: "Could not process the scanned QR code",
        variant: "destructive",
      })
    }
  }

  const confirmSplit = () => {
    if (!allItemsSelected) {
      toast({
        title: "Items Remaining",
        description: "Please select all items from the receipt before confirming",
        variant: "destructive",
      })
      return
    }

    if (!hasConfirmed && myItems.length > 0) {
      setConfirmations((prev) => prev + 1)
      setHasConfirmed(true)
      toast({
        title: "Split Confirmed",
        description: `${confirmations + 1} of ${totalParticipants} people have confirmed`,
      })

      // Since we're using 1 participant for demo, move to payment immediately
      setCurrentView("payment")
    } else if (myItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item from the receipt",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Already Confirmed",
        description: "You have already confirmed your selection",
        variant: "destructive",
      })
    }
  }

  const handlePayment = async () => {
    if (!connected || !publicKey || !signTransaction) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to make a payment",
        variant: "destructive",
      })
      return
    }

    try {
      setIsProcessingPayment(true)

      // In a real app, this would create a Solana transaction
      toast({
        title: "Processing Payment",
        description: "Preparing Solana transaction...",
      })

      // Calculate amount in SOL
      const amountInUsd = Number.parseFloat(calculateTotal(myItems))
      const amountInSol = Number.parseFloat(solToUsd(amountInUsd))
      const lamports = amountInSol * LAMPORTS_PER_SOL

      // Create a connection to the Solana devnet
      const connection = new Connection("https://api.devnet.solana.com", "confirmed")

      // Create a new transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey("7C4jsPZpht1JHMi1Y5Nfu8X9XcNYCTJbCpz9aQTLVUKp"), // Demo recipient address
          lamports: Math.round(lamports),
        }),
      )

      // Get the recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Sign the transaction
      const signedTransaction = await signTransaction(transaction)

      // Send the transaction
      const txid = await connection.sendRawTransaction(signedTransaction.serialize())

      // Wait for confirmation
      await connection.confirmTransaction(txid)

      // Set transaction hash
      setTransactionHash(txid)
      setTransactionSuccess(true)
      setCurrentView("success")

      // Add this payment to history
      const newPayment = {
        id: pastPayments.length + 1,
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        restaurant: "Solana Sushi",
        amount: amountInUsd,
        participants: totalParticipants,
        status: "completed",
        txHash: txid.slice(0, 5) + "..." + txid.slice(-5),
        fullTxHash: txid,
      }

      setPastPayments([newPayment, ...pastPayments])

      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully",
      })
    } catch (error) {
      console.error("Payment error:", error)
      setTransactionSuccess(false)
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const returnToHome = () => {
    // Reset state and return to home
    setCurrentView("home")
    setMyItems([])
    setReceiptItems([])
    setConfirmations(0)
    setHasConfirmed(false)
    setTransactionHash("")
    setTransactionSuccess(false)
  }

  const assignItem = (item: any) => {
    if (item.qty > 0) {
      // Add to my items
      const existingItem = myItems.find((i) => i.id === item.id)
      if (existingItem) {
        setMyItems(myItems.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)))
      } else {
        setMyItems([...myItems, { ...item, qty: 1 }])
      }

      // Update receipt items
      setReceiptItems(receiptItems.map((i) => (i.id === item.id ? { ...i, qty: i.qty - 1, assigned: true } : i)))

      // Reset confirmation if items change
      if (hasConfirmed) {
        setHasConfirmed(false)
        setConfirmations((prev) => prev - 1)
        toast({
          title: "Confirmation Reset",
          description: "Your confirmation has been reset due to changes",
        })
      }
    }
  }

  const removeItem = (item: any) => {
    // Remove from my items
    const updatedMyItems = myItems
      .map((i) => (i.id === item.id ? { ...i, qty: i.qty - 1 } : i))
      .filter((i) => i.qty > 0)

    setMyItems(updatedMyItems)

    // Add back to receipt items
    setReceiptItems(receiptItems.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)))

    // Reset confirmation if items change
    if (hasConfirmed) {
      setHasConfirmed(false)
      setConfirmations((prev) => prev - 1)
      toast({
        title: "Confirmation Reset",
        description: "Your confirmation has been reset due to changes",
      })
    }
  }

  const calculateTotal = (items: any[]) => {
    return items.reduce((total, item) => total + item.price * item.qty, 0).toFixed(2)
  }

  const solToUsd = (usd: number) => {
    // Mock conversion rate: 1 SOL = $100 USD
    return (usd / 100).toFixed(3)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-950 to-gray-900 text-white">
      <CoinGeckoWidget />
      <div className="container mx-auto px-4 py-8 max-w-md">
        {currentView === "home" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image src="/solbiu.png" alt="SOLbiu" fill className="object-contain" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  SOLbill-tiful
                </h1>
              </div>
              <div className="wallet-adapter-dropdown">
                <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
              </div>
            </div>

            {connected && publicKey && <NFTCollection walletAddress={publicKey.toString()} />}

            <Card className="bg-purple-900/50 border-purple-700">
              <CardContent className="p-6 flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-xl h-24 w-24 rounded-xl"
                  onClick={startSplit}
                  disabled={!connected}
                >
                  SPLIT!
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h2 className="text-lg font-medium text-purple-300">Past Payments</h2>
              {pastPayments.length > 0 ? (
                <div className="space-y-3">
                  {pastPayments.map((payment) => (
                    <Card key={payment.id} className="bg-purple-900/30 border-purple-800">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{payment.restaurant}</h3>
                            <p className="text-sm text-gray-400">{payment.date}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Split with {payment.participants} {payment.participants === 1 ? "person" : "people"}
                            </p>
                            {payment.txHash && (
                              <p className="text-xs text-purple-400 mt-1 flex items-center">
                                <span className="mr-1">TX:</span>
                                <a
                                  href={`https://explorer.solana.com/tx/${payment.fullTxHash}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center"
                                >
                                  {payment.txHash}
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${payment.amount.toFixed(2)}</p>
                            <p className="text-xs text-green-400 mt-1">{payment.status}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-purple-900/30 border-purple-800">
                  <CardContent className="p-4">
                    <p className="text-gray-400">No past payments</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {currentView === "receipt" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setCurrentView("home")}>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back
              </Button>
              <h2 className="text-lg font-medium text-purple-300">Split Receipt</h2>
            </div>

            <Card className="bg-purple-900/50 border-purple-700">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-yellow-900" />
                  </div>
                </div>
                <h3 className="text-center font-medium mb-1">Auto-generated Receipt</h3>
                <p className="text-center text-xs text-gray-400 mb-4">TICKET</p>
                <p className="text-center text-xs text-gray-400 mb-4">
                  DATE:{" "}
                  {new Date()
                    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    .toUpperCase()}
                  <br />
                  TIME:{" "}
                  {new Date()
                    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    .toUpperCase()}
                  <br />
                  REF: 001-00001
                </p>

                <div className="border-t border-b border-gray-700 py-2 mb-4">
                  <div className="grid grid-cols-12 text-xs text-gray-400 mb-1">
                    <div className="col-span-1">QTY</div>
                    <div className="col-span-7">ITEM</div>
                    <div className="col-span-2 text-right">UNIT</div>
                    <div className="col-span-2 text-right">PRICE</div>
                  </div>

                  {receiptItems.map((item) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 text-xs mb-1 cursor-pointer transition-colors ${
                        item.qty > 0 ? "hover:bg-purple-800/50" : "text-gray-500"
                      }`}
                      onClick={() => item.qty > 0 && assignItem(item)}
                    >
                      <div className="col-span-1">{item.qty}</div>
                      <div className="col-span-7">{item.name}</div>
                      <div className="col-span-2 text-right">${item.price.toFixed(2)}</div>
                      <div className="col-span-2 text-right">${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <div className={`mb-4 text-sm ${allItemsSelected ? "text-green-400" : "text-yellow-400"}`}>
                    {allItemsSelected
                      ? "All items selected! Ready to confirm."
                      : "Please select all items from the receipt."}
                  </div>
                  <Button
                    className={`w-full ${
                      hasConfirmed ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"
                    }`}
                    onClick={confirmSplit}
                    disabled={myItems.length === 0 || !allItemsSelected}
                  >
                    {hasConfirmed ? (
                      <span className="flex items-center">
                        <Check className="mr-2 h-4 w-4" />
                        Confirmed
                      </span>
                    ) : (
                      "Confirm"
                    )}
                    <span className="ml-2">
                      {confirmations}/{totalParticipants}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/30 border-purple-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2">Your Plate</h3>
                {myItems.length === 0 ? (
                  <p className="text-gray-400 text-sm">Add items from the receipt</p>
                ) : (
                  <div className="space-y-2">
                    {myItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            ${item.price.toFixed(2)} × {item.qty}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <p className="text-sm mr-2">${(item.price * item.qty).toFixed(2)}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400"
                            onClick={() => removeItem(item)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-700 flex justify-between">
                      <p className="font-medium">Total:</p>
                      <p className="font-medium">${calculateTotal(myItems)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === "payment" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setCurrentView("receipt")}>
                <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                Back
              </Button>
              <h2 className="text-lg font-medium text-purple-300">Payment</h2>
            </div>

            <Card className="bg-purple-900/50 border-purple-700">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                    <Receipt className="h-4 w-4 text-yellow-900" />
                  </div>
                </div>
                <h3 className="text-center font-medium mb-1">Auto-generated Receipt</h3>
                <p className="text-center text-xs text-gray-400 mb-4">
                  TICKET
                  <br />
                  DATE:{" "}
                  {new Date()
                    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                    .toUpperCase()}
                  <br />
                  TIME:{" "}
                  {new Date()
                    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                    .toUpperCase()}
                  <br />
                  REF: 001-00001
                </p>

                <div className="border-t border-gray-700 py-2 mb-4">
                  <div className="grid grid-cols-12 text-xs text-gray-400 mb-1">
                    <div className="col-span-1">QTY</div>
                    <div className="col-span-7">ITEM</div>
                    <div className="col-span-2 text-right">UNIT</div>
                    <div className="col-span-2 text-right">PRICE</div>
                  </div>

                  {myItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 text-xs mb-1">
                      <div className="col-span-1">{item.qty}</div>
                      <div className="col-span-7">{item.name}</div>
                      <div className="col-span-2 text-right">${item.price.toFixed(2)}</div>
                      <div className="col-span-2 text-right">${(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="bg-purple-800/50 rounded-lg p-3 flex justify-between items-center">
                    <span>Total USD:</span>
                    <span className="font-bold">${calculateTotal(myItems)}</span>
                  </div>

                  <div className="bg-purple-800/50 rounded-lg p-3 flex justify-between items-center">
                    <span>Total SOL:</span>
                    <span className="font-bold">{solToUsd(Number.parseFloat(calculateTotal(myItems)))} SOL</span>
                  </div>

                  <Button
                    className="bg-purple-600 hover:bg-purple-700 w-full"
                    onClick={handlePayment}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? "Processing..." : "PAY"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/30 border-purple-800">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-2">ITEMS</h3>
                <div className="space-y-1">
                  {myItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <p className="text-sm">{item.name}</p>
                      <p className="text-sm">${(item.price * item.qty).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === "success" && (
          <div className="h-[80vh] flex items-center justify-center">
            <Card className="bg-purple-900/50 border-purple-700 w-full">
              <CardContent className="p-6 text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-medium mb-2">Payment Successful!</h2>
                <p className="text-gray-400 mb-4">Your payment has been processed successfully.</p>

                <div className="bg-purple-800/30 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-gray-300 mb-1">Transaction Hash:</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-purple-400 truncate mr-2">{transactionHash}</p>
                    <a
                      href={`https://explorer.solana.com/tx/${transactionHash}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <NFTReward transactionHash={transactionHash} />

                <Button className="bg-purple-600 hover:bg-purple-700 w-full mt-4" onClick={returnToHome}>
                  Return Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={qrScannerOpen} onOpenChange={setQrScannerOpen}>
        <DialogContent className="bg-purple-900 border-purple-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Receipt QR Code</DialogTitle>
            <DialogDescription className="text-gray-400">
              Point your camera at the QR code on the receipt
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center">
            <div
              id="qr-reader"
              ref={qrScannerRef}
              className="w-full max-w-[300px] h-[300px] bg-black/50 rounded-lg overflow-hidden"
            ></div>
            <div className="flex justify-between w-full mt-4">
              <Button variant="outline" onClick={closeQrScanner}>
                Cancel
              </Button>
              <Button onClick={initQrScanner}>Start Scanner</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

