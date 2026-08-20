"use client";
import { useSyncExternalStore } from "react";
let current = null;
const listeners = new Set();
function subscribe(cb){ listeners.add(cb); return () => listeners.delete(cb); }
export function setActiveZoneId(id){ current=id; listeners.forEach((l)=>l()); }
function getSnapshot(){ return current; }
export function useActiveZoneId(){ return useSyncExternalStore(subscribe,getSnapshot,()=>null); }
