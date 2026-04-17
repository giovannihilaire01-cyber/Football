import * as THREE from 'three';

export function distance(v1: THREE.Vector3, v2: THREE.Vector3): number {
  return v1.distanceTo(v2);
}

export function normalize(v: THREE.Vector3): THREE.Vector3 {
  return v.clone().normalize();
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}
