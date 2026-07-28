"use client";

import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface HandwritingCanvasHandle {
  getDataUrl: () => string;
  clear: () => void;
}

interface HandwritingCanvasProps {
  onSave?: (dataUrl: string) => void;
  initialDataUrl?: string;
  width?: number;
  height?: number;
  className?: string;
  uniqueId?: string;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasHandle, HandwritingCanvasProps>(
  ({ onSave, initialDataUrl, width = 200, height = 80, className, uniqueId = "canvas" }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showMagnify, setShowMagnify] = useState(false);
    const [useKeyboard, setUseKeyboard] = useState(false);
    const [keyboardText, setKeyboardText] = useState("");
    const [showToolbar, setShowToolbar] = useState(false);
    const strokesRef = useRef<ImageData[]>([]);
    const currentStrokeRef = useRef<ImageData | null>(null);
    const redoStackRef = useRef<ImageData[]>([]);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    // Auto-save key
    const storageKey = `handwriting-${uniqueId}`;

    // Load initial data
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load from localStorage or initialDataUrl
      const saved = localStorage.getItem(storageKey);
      const imgSrc = saved || initialDataUrl;
      if (imgSrc) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = imgSrc;
      } else {
        drawGrid(ctx, canvas.width, canvas.height);
      }
    }, []);

    function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(0,0,0,0.05)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    function saveStroke() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      strokesRef.current.push(data);
      redoStackRef.current = [];
      // Auto-save to localStorage
      const dataUrl = canvas.toDataURL();
      localStorage.setItem(storageKey, dataUrl);
      onSave?.(dataUrl);
    }

    const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      const pos = getPointerPos(e);
      lastPosRef.current = pos;
      // Save current state before drawing
      currentStrokeRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.setPointerCapture(e.pointerId);
    }, []);

    const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pos = getPointerPos(e);
      const last = lastPosRef.current;
      if (!last) return;

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      lastPosRef.current = pos;
    }, [isDrawing]);

    const stopDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (isDrawing) {
        saveStroke();
        setIsDrawing(false);
        lastPosRef.current = null;
      }
    }, [isDrawing]);

    // Expose methods
    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        return canvasRef.current?.toDataURL() || "";
      },
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        strokesRef.current = [];
        redoStackRef.current = [];
        drawGrid(ctx, canvas.width, canvas.height);
        localStorage.removeItem(storageKey);
        onSave?.("");
      },
    }));

    const handleUndo = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (strokesRef.current.length === 0) return;
      const last = strokesRef.current.pop()!;
      redoStackRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      if (strokesRef.current.length > 0) {
        ctx.putImageData(strokesRef.current[strokesRef.current.length - 1], 0, 0);
      } else {
        drawGrid(ctx, canvas.width, canvas.height);
      }
      const dataUrl = canvas.toDataURL();
      localStorage.setItem(storageKey, dataUrl);
      onSave?.(dataUrl);
    };

    const handleRedo = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (redoStackRef.current.length === 0) return;
      const next = redoStackRef.current.pop()!;
      strokesRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      ctx.putImageData(next, 0, 0);
      const dataUrl = canvas.toDataURL();
      localStorage.setItem(storageKey, dataUrl);
      onSave?.(dataUrl);
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      strokesRef.current = [];
      redoStackRef.current = [];
      drawGrid(ctx, canvas.width, canvas.height);
      localStorage.removeItem(storageKey);
      onSave?.("");
    };

    const handleKeyboardSave = () => {
      onSave?.(keyboardText);
      setKeyboardText("");
      setUseKeyboard(false);
    };

    return (
      <div className={`relative ${className || ""}`}>
        {useKeyboard ? (
          <div className="flex gap-1">
            <Input
              value={keyboardText}
              onChange={(e) => setKeyboardText(e.target.value)}
              placeholder="输入原始记账..."
              className="flex-1"
            />
            <Button size="sm" variant="outline" onClick={handleKeyboardSave}>
              确认
            </Button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="border border-input rounded cursor-crosshair bg-white canvas-grid touch-none"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onMouseEnter={() => setShowToolbar(true)}
            onMouseLeave={() => setShowToolbar(false)}
            style={{ touchAction: "none" }}
          />
        )}

        <div className="flex gap-1 mt-1 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5"
            onClick={handleClear}
          >
            清除
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5"
            onClick={handleUndo}
          >
            撤销
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5"
            onClick={handleRedo}
          >
            重写
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5"
            onClick={() => setShowMagnify(true)}
          >
            放大
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-1.5"
            onClick={() => setUseKeyboard(true)}
          >
            键盘
          </Button>
        </div>

        <Dialog open={showMagnify} onOpenChange={setShowMagnify}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>放大书写</DialogTitle>
            </DialogHeader>
            <canvas
              ref={canvasRef}
              width={width * 2}
              height={height * 2}
              className="border border-input rounded cursor-crosshair bg-white w-full touch-none"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              style={{ touchAction: "none", minHeight: "300px" }}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMagnify(false)}>
                关闭
              </Button>
              <Button onClick={() => { setShowMagnify(false); saveStroke(); }}>
                保存
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

HandwritingCanvas.displayName = "HandwritingCanvas";

export { HandwritingCanvas };