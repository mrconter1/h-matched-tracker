'use client';

import { useEffect } from 'react';

const generateFavicon = () => {
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set transparent background
  ctx.clearRect(0, 0, 32, 32);

  // Draw trend line
  ctx.beginPath();
  ctx.moveTo(6, 6);  // Start a bit more from the edge
  ctx.lineTo(26, 26); // End a bit more from the edge
  ctx.strokeStyle = '#0ea5e9'; // Sky blue color
  ctx.lineWidth = 2; // Thinner line for minimalism
  ctx.lineCap = 'round'; // Rounded line ends
  ctx.stroke();

  // Add small dot at the end
  ctx.beginPath();
  ctx.arc(26, 26, 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#0ea5e9';
  ctx.fill();

  return canvas.toDataURL();
};

export function DynamicFavicon() {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    
    const faviconUrl = generateFavicon();
    if (faviconUrl) {
      link.href = faviconUrl;
    }
    
    if (!document.querySelector("link[rel*='icon']")) {
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, []);

  return null;
} 