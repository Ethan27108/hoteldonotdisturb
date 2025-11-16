// src/lib/api.ts

const BASE_URL = "http://127.0.0.1:8000";

async function request(url: string, options: RequestInit = {}) {
  console.log("🌍 API REQUEST →", url, options);   // ← DEBUG ADDED

  const res = await fetch(BASE_URL + url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("❌ API ERROR:", res.status, text);
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json();
}

/* =========================================================
   INTERFACES
   ========================================================= */

export interface Floor {
  id: string;
  floor_number: number;
  name: string;
}

export interface HotelRoom {
  id: string;
  room_number: string;
  room_type: string;
  floor_id: string;
  status: string;

  grid_x: number;
  grid_y: number;
  battery_level: number;

  assigned_maid_id: string | null;
}

export interface Maid {
  id: string;
  name: string;
  status: string;
}

export interface CleaningLog {
  id: string;
  room_id: string;
  maid_id: string | null;

  message?: string;
  notes?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;

  hotel_room?: {
    room_number: string;
    room_type: string;
  };
}

/* =========================================================
   API SERVICE
   ========================================================= */

class ApiService {
  /* ---------- FLOORS ---------- */

  getFloors(): Promise<Floor[]> {
    return request("/api/admin/viewFloor/");
  }

  createFloor(name: string, number: number): Promise<Floor> {
    return request("/api/admin/addFloor/", {
      method: "POST",
      body: JSON.stringify({ name, floor_number: number }),
    });
  }

  deleteFloor(id: string): Promise<any> {
    return request("/api/admin/deleteFloor/", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }

  /* ---------- ROOMS ---------- */

  getRooms(floor_id: string): Promise<HotelRoom[]> {
    return request("/api/admin/viewRoom/", {
      method: "POST",
      body: JSON.stringify({ floor_id }),
    });
  }

  createRoom(room: any): Promise<HotelRoom> {
    console.log("🔥 createRoom() CALLED with →", room); // ← STEP 1 DEBUG ADDED

    return request("/api/admin/addRoom/", {
      method: "POST",
      body: JSON.stringify({
        room_number: room.room_number,
        floor_id: room.floor_id,
        room_type: room.room_type ?? "Standard",
        status: room.status ?? "available",
      }),
    });
  }

  updateRoom(roomId: string, updates: any): Promise<HotelRoom> {
    return request("/api/admin/editRoom/", {
      method: "POST",
      body: JSON.stringify({ room_id: roomId, ...updates }),
    });
  }

  deleteRoom(roomId: string): Promise<any> {
    return request("/api/admin/deleteRoom/", {
      method: "POST",
      body: JSON.stringify({ room_id: roomId }),
    });
  }

  /* ---------- MAIDS ---------- */

  getMaids(): Promise<Maid[]> {
    return request("/api/admin/viewMaidProfile/");
  }

  createMaid(name: string): Promise<Maid> {
    return request("/api/admin/setupMaidProfile/", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  updateMaid(id: string, updates: any): Promise<Maid> {
    return request("/api/admin/updateMaid/", {
      method: "POST",
      body: JSON.stringify({ id, ...updates }),
    });
  }

  /* ---------- CLEANING LOGS ---------- */

  getCleaningLogs(): Promise<CleaningLog[]> {
    return request("/api/cleaningLogs/");
  }

  createCleaningLog(roomId: string, maidId: string, message: string) {
    return request("/api/maid/writeReport/", {
      method: "POST",
      body: JSON.stringify({
        room_id: roomId,
        maid_id: maidId,
        message,
      }),
    });
  }
}

export const api = new ApiService();
export {};
