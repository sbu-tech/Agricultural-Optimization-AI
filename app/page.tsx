"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Leaf, LineChart, Sun, Loader2 } from 'lucide-react'
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const yieldPredictionSchema = z.object({
  region: z.string().min(1, "Region is required"),
  soilType: z.string().min(1, "Soil type is required"),
  crop: z.string().min(1, "Crop is required"),
  fertilizer: z.string().min(1, "Fertilizer usage is required"),
  irrigation: z.string().min(1, "Irrigation usage is required"),
  daysToHarvest: z.string().regex(/^\d+$/, "Must be a valid number").refine((val) => parseInt(val) >= 0, "Cannot be negative"),
})

const cropRecommendationSchema = z.object({
  nitrogen: z.string().regex(/^\d+$/, "Must be a valid number").refine((val) => parseInt(val) >= 0, "Cannot be negative"),
  phosphorus: z.string().regex(/^\d+$/, "Must be a valid number").refine((val) => parseInt(val) >= 0, "Cannot be negative"),
  potassium: z.string().regex(/^\d+$/, "Must be a valid number").refine((val) => parseInt(val) >= 0, "Cannot be negative"),
  phValue: z.string().regex(/^\d*\.?\d+$/, "Must be a valid pH value")
    .refine((val) => parseFloat(val) >= 0 && parseFloat(val) <= 14, "pH must be between 0 and 14"),
})

export default function Home() {
  const [activeTab, setActiveTab] = useState("yield")
  const [predictionResult, setPredictionResult] = useState<string | null>(null)
  const [recommendationResult, setRecommendationResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const yieldForm = useForm<z.infer<typeof yieldPredictionSchema>>({
    resolver: zodResolver(yieldPredictionSchema),
  })

  const recommendationForm = useForm<z.infer<typeof cropRecommendationSchema>>({
    resolver: zodResolver(cropRecommendationSchema),
  })

  async function fetchWeatherData(region: string) {
    // Using OpenWeatherMap API which provides agricultural-relevant data
    const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${region}&units=metric&appid=${e44b2458fe3aa28d0eff33883d701e53}`
    )
    if (!response.ok) {
      throw new Error('Failed to fetch weather data')
    }
    const data = await response.json()
    return {
      current: {
        temp_c: data.main.temp,
        precip_mm: data.rain ? data.rain['1h'] || 0 : 0,
        humidity: data.main.humidity
      }
    }
  }

  async function onYieldSubmit(values: z.infer<typeof yieldPredictionSchema>) {
    setIsLoading(true)
    setError(null)
    try {
      const weatherData = await fetchWeatherData(values.region)
     
      // Combine form values with weather data
      const predictionData = {
        ...values,
        temperature: weatherData.current.temp_c,
        rainfall: weatherData.current.precip_mm,
        humidity: weatherData.current.humidity,
      }

      // Replace with your actual yield prediction API endpoint
      const response = await fetch('http://your-api-url.com/predict-yield', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionData),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch yield prediction')
      }

      const result = await response.json()
      setPredictionResult(`Predicted yield: ${result.yield} tons per hectare`)
    } catch (err) {
      setError('An error occurred while fetching the prediction')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function onRecommendationSubmit(values: z.infer<typeof cropRecommendationSchema>) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('https://agricultural-optimizer-api.onrender.com/api/recommend-crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_API_KEY
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch crop recommendations')
      }

      const result = await response.json()
      setRecommendationResult(`Recommended crops: ${result.crops.join(', ')}`)
    } catch (err) {
      setError('An error occurred while fetching recommendations')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
      <div className="container mx-auto py-10">
        <h1 className="text-4xl font-bold text-center mb-8 text-green-800 dark:text-green-100">Agricultural Optimizer</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yield" className="space-x-2">
              <LineChart className="h-5 w-5" />
              <span>Yield Prediction</span>
            </TabsTrigger>
            <TabsTrigger value="recommendation" className="space-x-2">
              <Leaf className="h-5 w-5" />
              <span>Crop Recommendation</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="yield">
            <Card className="border-green-200 dark:border-green-700">
              <CardHeader className="bg-green-100 dark:bg-green-800">
                <CardTitle className="text-2xl text-green-800 dark:text-green-100">Yield Prediction</CardTitle>
                <CardDescription className="text-green-700 dark:text-green-200">
                  Enter your field parameters to predict crop yield
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...yieldForm}>
                  <form onSubmit={yieldForm.handleSubmit(onYieldSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={yieldForm.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="north">North</SelectItem>
                                <SelectItem value="south">South</SelectItem>
                                <SelectItem value="east">East</SelectItem>
                                <SelectItem value="west">West</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={yieldForm.control}
                        name="soilType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Soil Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select soil type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="clay">Clay</SelectItem>
                                <SelectItem value="loam">Loam</SelectItem>
                                <SelectItem value="sandy">Sandy</SelectItem>
                                <SelectItem value="silt">Silt</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={yieldForm.control}
                        name="crop"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Crop</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select crop" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="wheat">Wheat</SelectItem>
                                <SelectItem value="rice">Rice</SelectItem>
                                <SelectItem value="corn">Corn</SelectItem>
                                <SelectItem value="soybean">Soybean</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={yieldForm.control}
                        name="fertilizer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fertilizer Usage</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select fertilizer usage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={yieldForm.control}
                        name="irrigation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Irrigation Usage</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select irrigation usage" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={yieldForm.control}
                        name="daysToHarvest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days to Harvest</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Sun className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="number" placeholder="Enter days to harvest" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Predicting...
                        </>
                      ) : (
                        'Predict Yield'
                      )}
                    </Button>
                  </form>
                </Form>
                {error && (
                  <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 rounded-lg text-red-800 dark:text-red-100">
                    <h3 className="font-semibold mb-2">Error:</h3>
                    {error}
                  </div>
                )}
                {predictionResult && (
                  <div className="mt-6 p-4 bg-green-100 dark:bg-green-800 rounded-lg text-green-800 dark:text-green-100">
                    <h3 className="font-semibold mb-2">Prediction Result:</h3>
                    {predictionResult}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="recommendation">
            <Card className="border-green-200 dark:border-green-700">
              <CardHeader className="bg-green-100 dark:bg-green-800">
                <CardTitle className="text-2xl text-green-800 dark:text-green-100">Crop Recommendation</CardTitle>
                <CardDescription className
="text-green-700 dark:text-green-200">
                  Enter soil parameters to get crop recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...recommendationForm}>
                  <form onSubmit={recommendationForm.handleSubmit(onRecommendationSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={recommendationForm.control}
                        name="nitrogen"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nitrogen Content</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter nitrogen content" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recommendationForm.control}
                        name="phosphorus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phosphorus Content</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter phosphorus content" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recommendationForm.control}
                        name="potassium"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potassium Content</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter potassium content" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={recommendationForm.control}
                        name="phValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>pH Value</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" placeholder="Enter pH value" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Getting Recommendations...
                        </>
                      ) : (
                        'Get Recommendations'
                      )}
                    </Button>
                  </form>
                </Form>
                {error && (
                  <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 rounded-lg text-red-800 dark:text-red-100">
                    <h3 className="font-semibold mb-2">Error:</h3>
                    {error}
                  </div>
                )}
                {recommendationResult && (
                  <div className="mt-6 p-4 bg-green-100 dark:bg-green-800 rounded-lg text-green-800 dark:text-green-100">
                    <h3 className="font-semibold mb-2">Recommendation Result:</h3>
                    {recommendationResult}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

