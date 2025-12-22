export interface Location {
    id?: string;
    location_id?: string;
    uuid?: string;
    camera_id?: string | number;
    name: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  
  export interface GenderCounts {
    male: number;
    female: number;
  }
  