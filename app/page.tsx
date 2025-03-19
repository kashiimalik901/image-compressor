"use client"

import { useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import imageCompression from "browser-image-compression"
import JSZip from "jszip"
import FileSaver from "file-saver"
import { Download, Upload, ImageIcon, Trash2, PackageOpen, Settings, Check, X, Loader2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Define types for our image objects
interface ImageItem {
  id: string
  file: File
  originalSize: number
  originalUrl: string
  compressedSize?: number
  compressedUrl?: string
  quality: number
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  error?: string
}

export default function ImageCompressor() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [defaultQuality, setDefaultQuality] = useState<number>(80)
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false)
  const [selectedTab, setSelectedTab] = useState<string>("gallery")
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [batchSettings, setBatchSettings] = useState({
    maxWidth: 1920,
    preserveExif: false,
    autoCompress: false,
  })

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const newImages = acceptedFiles.map((file) => {
          const id = generateId()
          return {
            id,
            file,
            originalSize: file.size,
            originalUrl: URL.createObjectURL(file),
            quality: defaultQuality,
            status: "pending",
            progress: 0,
          }
        })

        setImages((prev) => [...prev, ...newImages])

        // Auto compress if enabled
        if (batchSettings.autoCompress) {
          setTimeout(() => {
            compressAllImages([...images, ...newImages])
          }, 500)
        }
      }
    },
  })

  // Generate a unique ID for each image
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9)
  }

  // Compress a single image
  const compressImage = async (imageId: string) => {
    const imageIndex = images.findIndex((img) => img.id === imageId)
    if (imageIndex === -1) return

    const image = images[imageIndex]

    // Update status to processing
    setImages((prev) => {
      const updated = [...prev]
      updated[imageIndex] = {
        ...updated[imageIndex],
        status: "processing",
        progress: 0,
      }
      return updated
    })

    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: batchSettings.maxWidth,
        useWebWorker: true,
        initialQuality: image.quality / 100,
        exifOrientation: batchSettings.preserveExif ? 1 : -1,
        onProgress: (p: number) => {
          setImages((prev) => {
            const updated = [...prev]
            updated[imageIndex] = {
              ...updated[imageIndex],
              progress: Math.round(p * 100),
            }
            return updated
          })
        },
      }

      const compressedFile = await imageCompression(image.file, options)

      // Create URL for the compressed image
      const reader = new FileReader()
      reader.readAsDataURL(compressedFile)
      reader.onloadend = () => {
        const base64data = reader.result as string

        setImages((prev) => {
          const updated = [...prev]
          updated[imageIndex] = {
            ...updated[imageIndex],
            compressedUrl: base64data,
            compressedSize: compressedFile.size,
            status: "completed",
            progress: 100,
          }
          return updated
        })
      }
    } catch (error) {
      console.error("Error compressing image:", error)
      setImages((prev) => {
        const updated = [...prev]
        updated[imageIndex] = {
          ...updated[imageIndex],
          status: "error",
          error: "Failed to compress image",
          progress: 0,
        }
        return updated
      })
    }
  }

  // Compress all pending images
  const compressAllImages = async (imagesToProcess = images) => {
    const pendingImages = imagesToProcess.filter((img) => img.status === "pending")
    if (pendingImages.length === 0) return

    setIsProcessingAll(true)

    // Process images sequentially to avoid overwhelming the browser
    for (const image of pendingImages) {
      await compressImage(image.id)
    }

    setIsProcessingAll(false)
  }

  // Download a single compressed image
  const downloadImage = (imageId: string) => {
    const image = images.find((img) => img.id === imageId)
    if (!image || !image.compressedUrl) return

    const link = document.createElement("a")
    link.href = image.compressedUrl
    link.download = `compressed-${image.file.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Download all compressed images as a ZIP
  const downloadAllAsZip = async () => {
    const compressedImages = images.filter((img) => img.status === "completed")
    if (compressedImages.length === 0) return

    const zip = new JSZip()

    // Add each compressed image to the ZIP
    compressedImages.forEach((image) => {
      if (!image.compressedUrl) return

      // Convert base64 to blob
      const base64Data = image.compressedUrl.split(",")[1]
      const blob = base64ToBlob(base64Data, image.file.type)

      // Add to zip
      zip.file(`compressed-${image.file.name}`, blob)
    })

    // Generate and download the ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" })
    FileSaver.saveAs(zipBlob, "compressed-images.zip")
  }

  // Helper function to convert base64 to Blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)

      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    return new Blob(byteArrays, { type: mimeType })
  }

  // Remove a single image
  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  // Clear all images
  const clearAllImages = () => {
    setImages([])
    setShowDeleteAlert(false)
  }

  // Update quality for a specific image
  const updateImageQuality = (imageId: string, quality: number) => {
    setImages((prev) => {
      return prev.map((img) => {
        if (img.id === imageId) {
          return { ...img, quality }
        }
        return img
      })
    })
  }

  // Format bytes to human-readable format
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ["Bytes", "KB", "MB", "GB"]

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  }

  // Calculate savings percentage
  const calculateSavings = (original: number, compressed?: number) => {
    if (!compressed) return "0%"
    const savingsPercent = (((original - compressed) / original) * 100).toFixed(1)
    return `${savingsPercent}%`
  }

  // Calculate total savings
  const calculateTotalSavings = () => {
    const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0)
    const totalCompressed = images.reduce((sum, img) => sum + (img.compressedSize || 0), 0)

    if (totalOriginal === 0 || totalCompressed === 0) return "0%"

    const savingsPercent = (((totalOriginal - totalCompressed) / totalOriginal) * 100).toFixed(1)
    return `${savingsPercent}%`
  }

  // Get stats for compressed images
  const getStats = () => {
    const totalImages = images.length
    const compressedImages = images.filter((img) => img.status === "completed").length
    const totalOriginalSize = images.reduce((sum, img) => sum + img.originalSize, 0)
    const totalCompressedSize = images.reduce((sum, img) => sum + (img.compressedSize || 0), 0)

    return {
      totalImages,
      compressedImages,
      totalOriginalSize,
      totalCompressedSize,
      savingsPercent: calculateTotalSavings(),
    }
  }

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((image) => {
        URL.revokeObjectURL(image.originalUrl)
      })
    }
  }, [])

  const stats = getStats()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Free Online Image Compressor</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reduce your image file sizes without losing quality. Upload multiple JPG, PNG, or WEBP images, adjust
            compression settings, and download individually or as a ZIP file.
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50"
                }`}
                aria-label="Upload image area"
              >
                <input {...getInputProps()} aria-label="Upload image input" />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" aria-hidden="true" />
                  {isDragActive ? (
                    <p>Drop the images here...</p>
                  ) : (
                    <>
                      <p className="font-medium">Drag & drop images here, or click to select</p>
                      <p className="text-sm text-muted-foreground">
                        Supports multiple JPG, PNG, WEBP files (Max 10MB each)
                      </p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {images.length > 0 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Your Images</h2>
                  <p className="text-muted-foreground">
                    {stats.compressedImages} of {stats.totalImages} images compressed
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="gap-1">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => setShowDeleteAlert(true)} className="gap-1">
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadAllAsZip}
                    disabled={stats.compressedImages === 0}
                    className="gap-1"
                  >
                    <PackageOpen className="h-4 w-4" />
                    Download ZIP
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => compressAllImages()}
                    disabled={isProcessingAll || images.every((img) => img.status !== "pending")}
                    className="gap-1"
                  >
                    {isProcessingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Compress All
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Settings panel */}
              {showSettings && (
                <Card className="mb-4">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Compression Settings</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="default-quality">Default Quality</Label>
                          <span className="text-sm font-medium">{defaultQuality}%</span>
                        </div>
                        <Slider
                          id="default-quality"
                          value={[defaultQuality]}
                          min={40}
                          max={95}
                          step={1}
                          onValueChange={(value) => setDefaultQuality(value[0])}
                        />
                        <p className="text-xs text-muted-foreground">This will be applied to newly added images</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="max-width">Max Width/Height</Label>
                          <span className="text-sm font-medium">{batchSettings.maxWidth}px</span>
                        </div>
                        <Slider
                          id="max-width"
                          value={[batchSettings.maxWidth]}
                          min={800}
                          max={3840}
                          step={100}
                          onValueChange={(value) => setBatchSettings({ ...batchSettings, maxWidth: value[0] })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Larger images will be resized while maintaining aspect ratio
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="preserve-exif"
                          checked={batchSettings.preserveExif}
                          onCheckedChange={(checked) => setBatchSettings({ ...batchSettings, preserveExif: checked })}
                        />
                        <Label htmlFor="preserve-exif">Preserve EXIF data</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="auto-compress"
                          checked={batchSettings.autoCompress}
                          onCheckedChange={(checked) => setBatchSettings({ ...batchSettings, autoCompress: checked })}
                        />
                        <Label htmlFor="auto-compress">Auto-compress new images</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats card */}
              {stats.compressedImages > 0 && (
                <Card className="mb-4">
                  <CardContent className="p-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Savings</h3>
                        <p className="text-2xl font-bold">{stats.savingsPercent}</p>
                      </div>

                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Original Size</h3>
                        <p className="text-2xl font-bold">{formatBytes(stats.totalOriginalSize)}</p>
                      </div>

                      <div className="text-center p-4 bg-primary/5 rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Compressed Size</h3>
                        <p className="text-2xl font-bold">{formatBytes(stats.totalCompressedSize)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Image gallery */}
              <Tabs defaultValue="gallery" value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="gallery">Gallery View</TabsTrigger>
                  <TabsTrigger value="list">List View</TabsTrigger>
                </TabsList>

                <TabsContent value="gallery" className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <CardHeader className="p-4 pb-0">
                          <div className="flex justify-between items-start">
                            <div className="truncate pr-2">
                              <p className="font-medium truncate">{image.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatBytes(image.originalSize)}
                                {image.compressedSize && (
                                  <>
                                    {" "}
                                    → {formatBytes(image.compressedSize)} (
                                    {calculateSavings(image.originalSize, image.compressedSize)} saved)
                                  </>
                                )}
                              </p>
                            </div>
                            <Badge
                              variant={
                                image.status === "completed"
                                  ? "default"
                                  : image.status === "processing"
                                    ? "outline"
                                    : image.status === "error"
                                      ? "destructive"
                                      : "secondary"
                              }
                              className="ml-auto shrink-0"
                            >
                              {image.status === "completed"
                                ? "Compressed"
                                : image.status === "processing"
                                  ? "Processing"
                                  : image.status === "error"
                                    ? "Error"
                                    : "Pending"}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4">
                          <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                            <img
                              src={image.compressedUrl || image.originalUrl}
                              alt={image.file.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>

                          {image.status === "processing" && <Progress value={image.progress} className="h-2 mt-4" />}

                          {image.status === "pending" && (
                            <div className="mt-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Quality</span>
                                <span className="text-sm font-medium">{image.quality}%</span>
                              </div>
                              <Slider
                                value={[image.quality]}
                                min={40}
                                max={95}
                                step={1}
                                onValueChange={(value) => updateImageQuality(image.id, value[0])}
                              />
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="p-4 pt-0 flex justify-between">
                          <Button variant="outline" size="sm" onClick={() => removeImage(image.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>

                          {image.status === "pending" && (
                            <Button size="sm" onClick={() => compressImage(image.id)}>
                              Compress
                            </Button>
                          )}

                          {image.status === "completed" && (
                            <Button size="sm" onClick={() => downloadImage(image.id)}>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}

                          {image.status === "error" && (
                            <Button size="sm" variant="outline" onClick={() => compressImage(image.id)}>
                              Retry
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="list">
                  <Card>
                    <CardContent className="p-0">
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 p-4 bg-muted/50 text-sm font-medium">
                          <div className="col-span-5">File Name</div>
                          <div className="col-span-2 text-center">Original</div>
                          <div className="col-span-2 text-center">Compressed</div>
                          <div className="col-span-1 text-center">Savings</div>
                          <div className="col-span-2 text-center">Actions</div>
                        </div>

                        {images.map((image) => (
                          <div key={image.id} className="grid grid-cols-12 p-4 items-center border-t">
                            <div className="col-span-5 flex items-center gap-2 truncate">
                              <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                                <img
                                  src={image.originalUrl || "/placeholder.svg"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="truncate">{image.file.name}</span>
                              {image.status === "processing" && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
                              {image.status === "completed" && <Check className="h-3 w-3 text-green-500 ml-1" />}
                              {image.status === "error" && <X className="h-3 w-3 text-red-500 ml-1" />}
                            </div>

                            <div className="col-span-2 text-center text-sm">{formatBytes(image.originalSize)}</div>

                            <div className="col-span-2 text-center text-sm">
                              {image.compressedSize ? formatBytes(image.compressedSize) : "-"}
                            </div>

                            <div className="col-span-1 text-center text-sm">
                              {image.compressedSize ? calculateSavings(image.originalSize, image.compressedSize) : "-"}
                            </div>

                            <div className="col-span-2 flex justify-center gap-1">
                              {image.status === "pending" && (
                                <Button size="sm" variant="outline" onClick={() => compressImage(image.id)}>
                                  Compress
                                </Button>
                              )}

                              {image.status === "completed" && (
                                <Button size="sm" variant="outline" onClick={() => downloadImage(image.id)}>
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Download</span>
                                </Button>
                              )}

                              {image.status === "error" && (
                                <Button size="sm" variant="outline" onClick={() => compressImage(image.id)}>
                                  Retry
                                </Button>
                              )}

                              <Button size="sm" variant="ghost" onClick={() => removeImage(image.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {images.length === 0 && (
            <Card className="text-center p-12">
              <CardContent className="flex flex-col items-center justify-center">
                <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" aria-hidden="true" />
                <h3 className="text-xl font-medium mb-2">No Images Added</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Upload one or more images to start compressing. You can compress them individually or all at once.
                </p>
                <Button onClick={() => document.querySelector('input[type="file"]')?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Select Images
                </Button>
              </CardContent>
            </Card>
          )}

          <section className="mt-16 max-w-3xl mx-auto" aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-2xl font-bold mb-6 text-center">
              How It Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-medium mb-2">1. Upload</h3>
                  <p className="text-sm text-muted-foreground">
                    Select or drag & drop multiple JPG, PNG or WebP image files you want to compress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-medium mb-2">2. Adjust</h3>
                  <p className="text-sm text-muted-foreground">
                    Set the compression level for each image or use batch settings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Download className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-medium mb-2">3. Download</h3>
                  <p className="text-sm text-muted-foreground">Download individual images or get all as a ZIP file</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-16 max-w-3xl mx-auto" aria-labelledby="benefits">
            <h2 id="benefits" className="text-2xl font-bold mb-6 text-center">
              Benefits of Batch Image Compression
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-2">Process Multiple Images</h3>
                  <p className="text-muted-foreground">
                    Save time by uploading and compressing multiple images at once instead of processing them one by
                    one.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-2">Bulk Download Options</h3>
                  <p className="text-muted-foreground">
                    Download all your compressed images as a single ZIP file or individually as needed.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-2">Persistent Storage</h3>
                  <p className="text-muted-foreground">
                    Your compressed images remain available until you close the browser, allowing you to work at your
                    own pace.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium text-lg mb-2">Custom Quality Settings</h3>
                  <p className="text-muted-foreground">
                    Adjust compression settings for each image individually or apply batch settings to all images at
                    once.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-16 max-w-3xl mx-auto" aria-labelledby="faq">
            <h2 id="faq" className="text-2xl font-bold mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How many images can I compress at once?</AccordionTrigger>
                <AccordionContent>
                  You can upload and compress as many images as you want. However, for optimal performance, we recommend
                  processing batches of 20-30 images at a time, especially if the images are large.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Will my images be stored on your servers?</AccordionTrigger>
                <AccordionContent>
                  No, all compression happens directly in your browser. Your images are never uploaded to our servers,
                  ensuring complete privacy and security. This client-side processing means your original images never
                  leave your device.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>How long are my compressed images available?</AccordionTrigger>
                <AccordionContent>
                  Your compressed images remain available in your browser until you close the tab or refresh the page.
                  We recommend downloading your compressed images as soon as they're ready, either individually or as a
                  ZIP file.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What's the maximum file size for upload?</AccordionTrigger>
                <AccordionContent>
                  The maximum file size for each image is 10MB. This limit helps ensure optimal performance of the
                  compression tool. If you have larger files, you may need to resize them first or use specialized
                  software.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Can I adjust compression settings for each image?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can set a different quality level for each image individually. You can also configure default
                  settings that will be applied to all newly uploaded images, saving you time when processing multiple
                  files.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>Will compressing images affect their quality?</AccordionTrigger>
                <AccordionContent>
                  Our image compressor uses smart algorithms to reduce file size while maintaining visual quality. At
                  high quality settings (80-95%), the difference is barely noticeable to the human eye. You can adjust
                  the quality slider to find the perfect balance between file size and image quality for your needs.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <footer className="mt-20 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Image Compressor Tool. All rights reserved.</p>
            <div className="mt-2 flex justify-center gap-4">
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </div>
            <p className="mt-4">
              Compress multiple JPG, PNG, and WebP images online without losing quality. Free batch image compression
              tool for websites, social media, and email.
            </p>
          </footer>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all images?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all images from the current session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllImages}>Clear All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

