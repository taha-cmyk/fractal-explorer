"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Camera, Download, ZoomIn, ZoomOut } from 'lucide-react';

const MAX_ITERATIONS = 1000;

const FractalExplorer = () => {
  const canvasRef = useRef(null);
  const [fractalType, setFractalType] = useState('mandelbrot');
  const [iterations, setIterations] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [colorScheme, setColorScheme] = useState('default');
  const [juliaReal, setJuliaReal] = useState(-0.7);
  const [juliaImag, setJuliaImag] = useState(0.27015);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const drawFractal = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(canvasSize.width, canvasSize.height);

    for (let x = 0; x < canvasSize.width; x++) {
      for (let y = 0; y < canvasSize.height; y++) {
        const belongsToSet = calculateFractal(x, y);
        const color = getColor(belongsToSet);
        setPixel(imageData, x, y, color);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [fractalType, iterations, zoom, centerX, centerY, colorScheme, juliaReal, juliaImag, canvasSize]);

  useEffect(() => {
    drawFractal();
  }, [drawFractal]);

  const calculateFractal = (x, y) => {
    const aspectRatio = canvasSize.width / canvasSize.height;
    const realPart = (x - canvasSize.width / 2) * (4 / canvasSize.height) / zoom * aspectRatio + centerX;
    const imaginaryPart = (y - canvasSize.height / 2) * (4 / canvasSize.height) / zoom + centerY;

    switch (fractalType) {
      case 'mandelbrot':
        return calculateMandelbrot(realPart, imaginaryPart);
      case 'julia':
        return calculateJulia(realPart, imaginaryPart, juliaReal, juliaImag);
      case 'burningShip':
        return calculateBurningShip(realPart, imaginaryPart);
      case 'mandelbox':
        return calculateMandelbox(realPart, imaginaryPart);
      default:
        return 0;
    }
  };

  const calculateMandelbrot = (realPart, imaginaryPart) => {
    let x = 0, y = 0;
    for (let i = 0; i < iterations; i++) {
      const x2 = x * x, y2 = y * y;
      if (x2 + y2 > 4) return i;
      y = 2 * x * y + imaginaryPart;
      x = x2 - y2 + realPart;
    }
    return iterations;
  };

  const calculateJulia = (realPart, imaginaryPart, cReal, cImag) => {
    let x = realPart, y = imaginaryPart;
    for (let i = 0; i < iterations; i++) {
      const x2 = x * x, y2 = y * y;
      if (x2 + y2 > 4) return i;
      y = 2 * x * y + cImag;
      x = x2 - y2 + cReal;
    }
    return iterations;
  };

  const calculateBurningShip = (realPart, imaginaryPart) => {
    let x = 0, y = 0;
    for (let i = 0; i < iterations; i++) {
      const x2 = x * x, y2 = y * y;
      if (x2 + y2 > 4) return i;
      y = Math.abs(2 * x * y) + imaginaryPart;
      x = x2 - y2 + realPart;
    }
    return iterations;
  };

  const calculateMandelbox = (realPart, imaginaryPart) => {
    let x = realPart, y = imaginaryPart, z = 0;
    const scale = 2;
    for (let i = 0; i < iterations; i++) {
      x = boxFold(x) * scale + realPart;
      y = boxFold(y) * scale + imaginaryPart;
      z = boxFold(z) * scale;
      const r = x * x + y * y + z * z;
      if (r > 16) return i;
    }
    return iterations;
  };

  const boxFold = (value) => {
    if (value > 1) return 2 - value;
    if (value < -1) return -2 - value;
    return value;
  };

  const getColor = (iteration) => {
    if (iteration === iterations) return [0, 0, 0, 255];

    switch (colorScheme) {
      case 'rainbow':
        return [
          Math.sin(0.3 * iteration) * 127 + 128,
          Math.sin(0.3 * iteration + 2) * 127 + 128,
          Math.sin(0.3 * iteration + 4) * 127 + 128,
          255
        ];
      case 'fire':
        return [
          Math.min(255, iteration * 8),
          Math.min(255, iteration * 4),
          0,
          255
        ];
      case 'electric':
        return [
          Math.min(255, iteration * 4),
          Math.min(255, iteration * 8),
          Math.min(255, iteration * 16),
          255
        ];
      default:
        return [
          iteration % 16 * 16,
          iteration % 8 * 32,
          iteration % 4 * 64,
          255
        ];
    }
  };

  const setPixel = (imageData, x, y, color) => {
    const index = (y * canvasSize.width + x) * 4;
    imageData.data[index] = color[0];
    imageData.data[index + 1] = color[1];
    imageData.data[index + 2] = color[2];
    imageData.data[index + 3] = color[3];
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => prevZoom * 1.5);
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => prevZoom / 1.5);
  };

  const handleDoubleClick = (event) => {
    const { clientX, clientY } = event;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const newCenterX = centerX + (canvasX - canvasSize.width / 2) * (4 / canvasSize.height) / zoom;
    const newCenterY = centerY + (canvasY - canvasSize.height / 2) * (4 / canvasSize.height) / zoom;

    setCenterX(newCenterX);
    setCenterY(newCenterY);
    setZoom((prevZoom) => prevZoom * 2);
  };

  const handleMouseDown = (event) => {
    setIsDragging(true);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event) => {
    if (!isDragging) return;
    const dx = event.clientX - lastMousePos.x;
    const dy = event.clientY - lastMousePos.y;
    setCenterX((prevX) => prevX - dx * (2 / canvasSize.height) / zoom);
    setCenterY((prevY) => prevY - dy * (2 / canvasSize.height) / zoom);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setCenterX(0);
    setCenterY(0);
    setZoom(1);
    setJuliaReal(-0.7);
    setJuliaImag(0.27015);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `fractal-${fractalType}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="cursor-move"
      />
      
      <div className="absolute top-4 left-4 right-4 bg-white bg-opacity-80 p-4 rounded-lg shadow-lg">
        <div className="flex flex-wrap gap-4 items-center">
          <Select value={fractalType} onValueChange={setFractalType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select fractal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mandelbrot">Mandelbrot Set</SelectItem>
              <SelectItem value="julia">Julia Set</SelectItem>
              <SelectItem value="burningShip">Burning Ship</SelectItem>
              <SelectItem value="mandelbox">Mandelbox</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={colorScheme} onValueChange={setColorScheme}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select color scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="rainbow">Rainbow</SelectItem>
              <SelectItem value="fire">Fire</SelectItem>
              <SelectItem value="electric">Electric</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <span>Detail:</span>
            <Slider
              min={10}
              max={MAX_ITERATIONS}
              step={10}
              value={[iterations]}
              onValueChange={(value) => setIterations(value[0])}
              className="w-32"
            />
            <span>{iterations}</span>
          </div>

          {fractalType === 'julia' && (
            <>
              <div className="flex items-center space-x-2">
                <span>Julia Real:</span>
                <Slider
                  min={-2}
                  max={2}
                  step={0.01}
                  value={[juliaReal]}
                  onValueChange={(value) => setJuliaReal(value[0])}
                  className="w-32"
                />
                <span>{juliaReal.toFixed(2)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Julia Imag:</span>
                <Slider
                  min={-2}
                  max={2}
                  step={0.01}
                  value={[juliaImag]}
                  onValueChange={(value) => setJuliaImag(value[0])}
                  className="w-32"
                />
                <span>{juliaImag.toFixed(2)}</span>
              </div>
            </>
          )}
          
          <Button onClick={resetView}>
            <Camera className="mr-2 h-4 w-4" />
            Reset View
          </Button>
          
          <Button onClick={exportImage}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">How to Use</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>How to Use the Full Screen Fractal Explorer</AlertDialogTitle>
                <AlertDialogDescription>
                  1. Choose from Mandelbrot, Julia, Burning Ship, or Mandelbox sets.<br />
                  2. Adjust the Detail slider for more intricate patterns.<br />
                  3. Use the zoom buttons to zoom in or out.<br />
                  4. Click and drag to move around the fractal.<br />
                  5. Use the color scheme selector to change the visualization.<br />
                  6. For Julia set, adjust the Real and Imaginary parameters.<br />
                  7. Click &quot;Reset View&quot; to return to the initial state.<br />
                  8. Use &quot;Export&quot; to save your creation as a PNG file.<br />
                  Explore and enjoy the mesmerizing world of fractals!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Got it!</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex space-x-2">
        <Button onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FractalExplorer;
