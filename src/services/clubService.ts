import type { PadelClub } from '../types/padel';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, cleanForFirestore } from './firebase';

const CLUBS_STORAGE_KEY = 'padelmatch_clubs_v1';

export const INITIAL_CLUBS_IV_REGION: PadelClub[] = [
  // LA SERENA
  {
    id: 'club-padel-4-esquinas',
    name: 'Pádel 4 Esquinas',
    city: 'La Serena',
    commune: 'Sector Estadio / 4 Esquinas',
    address: 'Av. Cuatro Esquinas s/n (casi esq. Estadio)',
    courtsCount: 8,
    indoorOutdoor: 'outdoor',
    instagram: '@padel4esquinas',
    services: ['8 Canchas Vidriadas', 'Iluminación LED', 'Cafetería & Bar', 'Tienda Especializada', 'Estacionamiento Privado'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-alto-serena',
    name: 'Complejo Pádel Alto Serena',
    city: 'La Serena',
    commune: 'San Joaquín / Ulriksen',
    address: 'Guillermo Ulriksen 340, La Serena',
    courtsCount: 6,
    indoorOutdoor: 'mixto',
    instagram: '@altoserena.cd',
    services: ['Canchas Panorámicas', 'Canchas Techadas', 'Academia de Menores', 'Cafetería', 'Quinchos'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-black-padel',
    name: 'Black Pádel La Serena',
    city: 'La Serena',
    commune: 'Pampa Baja',
    address: 'Pampa Baja 65, La Serena',
    courtsCount: 4,
    indoorOutdoor: 'outdoor',
    instagram: '@blackpadellaserena',
    services: ['4 Canchas Profesionales', 'Cafetería Deportiva', 'Estacionamiento', 'Torneos'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-punto-verde',
    name: 'Club Deportivo Punto Verde',
    city: 'La Serena',
    commune: 'Ruta 5 Norte / Huanhualí',
    address: 'Ruta 5 Norte km 470 (entre 4 Esquinas y Huanhualí)',
    courtsCount: 4,
    indoorOutdoor: 'outdoor',
    website: 'https://clubpuntoverde.cl',
    services: ['Complejo Multideportivo', 'Pádel', 'Tenis', 'Piscina', 'Restaurante / Quincho'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-ceres-padel',
    name: 'Ceres Pádel Club',
    city: 'La Serena',
    commune: 'Sector Ceres / Aeropuerto La Florida',
    address: 'Camino a Ceres s/n, La Serena',
    courtsCount: 4,
    indoorOutdoor: 'outdoor',
    services: ['Césped Sintético Monofilamento', 'Quinchos Familiares', 'Estacionamiento Amplio', 'Reservas Easycancha'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-padel-panoramico',
    name: 'Pádel Panorámico La Serena',
    city: 'La Serena',
    commune: 'San Joaquín',
    address: 'Pasaje Italia 120, La Serena',
    courtsCount: 3,
    indoorOutdoor: 'outdoor',
    services: ['Canchas Panorámicas', 'Clases Personalizadas', 'Iluminación de Competición'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-smash-padel',
    name: 'Smash Pádel La Serena',
    city: 'La Serena',
    commune: 'San Joaquín / Los Nísperos',
    address: 'Los Nísperos 42, La Serena',
    courtsCount: 3,
    indoorOutdoor: 'outdoor',
    services: ['Escuela de Pádel', 'Cafetería', 'Arriendo de Palas y Pelotas'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-cendyr-san-joaquin',
    name: 'CENDYR San Joaquín Pádel',
    city: 'La Serena',
    commune: 'Subida San Joaquín',
    address: 'Subida San Joaquín 1784, La Serena',
    courtsCount: 2,
    indoorOutdoor: 'outdoor',
    services: ['Canchas Deportivas IND', 'Talleres Formativos', 'Torneos Comunitarios'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-golf-la-serena',
    name: 'Club de Golf La Serena (Pádel)',
    city: 'La Serena',
    commune: 'Cerro Grande / Ulriksen',
    address: 'Av. del Golf 100, La Serena',
    courtsCount: 3,
    indoorOutdoor: 'outdoor',
    services: ['Club House', 'Restaurante', 'Estacionamiento Privado', 'Pro-Shop'],
    verified: true,
    createdAt: 1788000000000
  },

  // COQUIMBO
  {
    id: 'club-penuelas-padel',
    name: 'Peñuelas Pádel Club',
    city: 'Coquimbo',
    commune: 'Peñuelas Sur',
    address: 'Av. Peñuelas Sur, Parcela 65 A, Coquimbo',
    courtsCount: 4,
    indoorOutdoor: 'outdoor',
    instagram: '@penuelaspadel.cl',
    services: ['Sede Oficial FEPACHI', 'Canchas Panorámicas', 'Terraza Tercer Tiempo', 'Cafetería & Bar'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-del-mar',
    name: 'Club del Mar IV Región',
    city: 'Coquimbo',
    commune: 'Peñuelas Costanera',
    address: 'Av. Los Pescadores 5430, Coquimbo',
    courtsCount: 6,
    indoorOutdoor: 'mixto',
    instagram: '@club_delmar',
    services: ['Canchas Indoor Techadas', 'Canchas Outdoor', 'Torneos Regionales', 'Restaurante Vista al Mar'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-465-padel',
    name: '465 Padel Club',
    city: 'Coquimbo',
    commune: 'Vegas Sur / Las Parcelas',
    address: 'Camino Las Parcelas, Vegas Sur 29C, Coquimbo',
    courtsCount: 3,
    indoorOutdoor: 'outdoor',
    instagram: '@465padelclub',
    services: ['Academia de Menores y Adultos', 'Quinchos para Eventos', 'Cafetería', 'Tercer Tiempo'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-la-herradura-padel',
    name: 'La Herradura Pádel Club',
    city: 'Coquimbo',
    commune: 'La Herradura',
    address: 'El Faro 11, Sector La Herradura, Coquimbo',
    courtsCount: 3,
    indoorOutdoor: 'outdoor',
    services: ['Vista a la Bahía de La Herradura', 'Ambiente Familiar', 'Cafetería', 'Estacionamiento'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-tenis-coquimbo-padel',
    name: 'Club de Tenis Coquimbo (Pádel)',
    city: 'Coquimbo',
    commune: 'Peñuelas',
    address: 'La Barca 318, Peñuelas, Coquimbo',
    courtsCount: 3,
    indoorOutdoor: 'outdoor',
    services: ['Club Tradicional', 'Tenis y Pádel', 'Camarines', 'Eventos Deportivos'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-las-mostazas-padel',
    name: 'Club Las Mostazas Pádel',
    city: 'Coquimbo',
    commune: 'Pan de Azúcar / Las Mostazas',
    address: 'Ruta D-409, Sector Las Mostazas, Coquimbo',
    courtsCount: 4,
    indoorOutdoor: 'outdoor',
    services: ['Entorno Natural / Campestre', 'Quinchos Familiares', 'Áreas Verdes', 'Estacionamiento'],
    verified: true,
    createdAt: 1788000000000
  },
  {
    id: 'club-la-cantera-padel',
    name: 'La Cantera Pádel Coquimbo',
    city: 'Coquimbo',
    commune: 'La Cantera',
    address: 'Camino La Cantera 2500, Coquimbo',
    courtsCount: 4,
    indoorOutdoor: 'outdoor',
    services: ['Canchas Panorámicas', 'Cafetería', 'Conectividad Rápida La Serena - Coquimbo'],
    verified: true,
    createdAt: 1788000000000
  }
];

class ClubService {
  private clubs: PadelClub[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.initFirestoreSync();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.clubs = [...INITIAL_CLUBS_IV_REGION];
      return;
    }
    try {
      const raw = localStorage.getItem(CLUBS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PadelClub[];
        // Combine initial verified clubs with any custom clubs stored locally
        const customClubs = parsed.filter(c => !INITIAL_CLUBS_IV_REGION.some(ic => ic.id === c.id));
        this.clubs = [...INITIAL_CLUBS_IV_REGION, ...customClubs];
      } else {
        this.clubs = [...INITIAL_CLUBS_IV_REGION];
        this.saveToStorage(false);
      }
    } catch {
      this.clubs = [...INITIAL_CLUBS_IV_REGION];
    }
  }

  private initFirestoreSync() {
    try {
      onSnapshot(collection(db, 'clubs'), (snapshot) => {
        if (snapshot.empty) {
          // Cloud collection is empty: seed cloud with default clubs
          this.seedInitialClubsToCloud();
          return;
        }

        const cloudClubs: PadelClub[] = [];
        snapshot.forEach(docSnap => {
          cloudClubs.push(docSnap.data() as PadelClub);
        });

        // Merge cloud clubs with default initial clubs
        const mergedMap = new Map<string, PadelClub>();
        INITIAL_CLUBS_IV_REGION.forEach(c => mergedMap.set(c.id, c));
        cloudClubs.forEach(c => mergedMap.set(c.id, c));

        this.clubs = Array.from(mergedMap.values());
        this.saveToStorage(false);
      }, (err) => {
        console.warn('Firestore clubs sync notice:', err);
      });
    } catch (e) {
      console.warn('Error starting Firestore clubs sync:', e);
    }
  }

  public seedInitialClubsToCloud() {
    INITIAL_CLUBS_IV_REGION.forEach(club => {
      setDoc(doc(db, 'clubs', club.id), cleanForFirestore(club), { merge: true }).catch(console.warn);
    });
  }

  private saveToStorage(syncToCloud = true) {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      this.notify();
      return;
    }
    try {
      localStorage.setItem(CLUBS_STORAGE_KEY, JSON.stringify(this.clubs));
    } catch (e) {
      console.warn('Error saving clubs to storage:', e);
    }
    if (syncToCloud) {
      this.clubs.forEach(c => {
        setDoc(doc(db, 'clubs', c.id), cleanForFirestore(c), { merge: true }).catch(console.warn);
      });
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getClubs(): PadelClub[] {
    return this.clubs;
  }

  public getClubsByCity(city: string): PadelClub[] {
    if (!city || city === 'all') return this.clubs;
    const norm = city.trim().toLowerCase();
    return this.clubs.filter(c => c.city.toLowerCase().includes(norm));
  }

  public searchClubs(query: string, cityFilter?: string): PadelClub[] {
    let list = this.clubs;
    if (cityFilter && cityFilter !== 'all') {
      const cNorm = cityFilter.trim().toLowerCase();
      list = list.filter(c => c.city.toLowerCase().includes(cNorm));
    }
    if (!query || !query.trim()) return list;

    const q = query.trim().toLowerCase();
    return list.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.commune && c.commune.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  }

  public addCustomClub(name: string, city: string = 'La Serena'): PadelClub {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('El nombre del club no puede estar vacío');

    // Check if club already exists by exact or close name
    const existing = this.clubs.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return existing;
    }

    const newClubId = `club-custom-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`;
    const newClub: PadelClub = {
      id: newClubId,
      name: trimmed,
      city: city.trim() || 'La Serena',
      commune: 'Comunidad PadelMatch',
      address: 'Ingresado por usuario',
      indoorOutdoor: 'outdoor',
      services: ['Club Comunitario'],
      verified: false,
      createdAt: Date.now()
    };

    this.clubs.push(newClub);
    this.saveToStorage(true);
    return newClub;
  }
}

export const clubService = new ClubService();
