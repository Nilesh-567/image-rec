"use client";

import { useState, useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { Upload, Camera, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [predictions, setPredictions] = useState<Array<{ className: string; probability: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        // Load model with progress tracking
        await tf.ready();
        const loadedModel = await mobilenet.load({
          version: 2,
          alpha: 1.0,
          modelUrl: undefined,
          weightUrlPrefix: undefined,
          onProgress: (progress) => {
            setModelProgress(Math.round(progress * 100));
          },
        });
        setModel(loadedModel);
      } catch (error) {
        console.error("Failed to load model:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadModel();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        classifyImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const classifyImage = async (imageSource: string) => {
    if (!model) return;

    try {
      setIsLoading(true);
      const img = new Image();
      img.src = imageSource;
      await img.decode(); // Ensure image is loaded
      
      const predictions = await model.classify(img, 5);
      setPredictions(predictions);
    } catch (error) {
      console.error("Failed to classify image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-12 h-12 text-primary" />
            <h1 className="text-4xl font-bold">AI Vision Explorer</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Upload an image and let our AI model identify what it sees
          </p>
        </div>

        {/* Main Content */}
        <Card className="p-6 space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={triggerFileInput}
                className="gap-2"
                disabled={isLoading || !model}
              >
                <Upload className="w-5 h-5" />
                Upload Image
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                disabled={true}
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </Button>
            </div>

            {/* Loading States */}
            {!model && (
              <div className="space-y-2">
                <Progress value={modelProgress} />
                <p className="text-center text-sm text-muted-foreground">
                  Loading AI Model... {modelProgress}%
                </p>
              </div>
            )}
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Analysis Results</h2>
              <div className="grid gap-3">
                {predictions.map((prediction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <span className="font-medium">
                      {prediction.className}
                    </span>
                    <span className="text-muted-foreground">
                      {(prediction.probability * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}